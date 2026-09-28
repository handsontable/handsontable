import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';
import { type CellValue } from './windowTypes';

/**
 * Page object for the DEV-2524 fixture: whether the rows pinned by `fixedRowsTop` and
 * `fixedRowsBottom` take part in filtering, and whether one column can opt out of filtering
 * through `columns: [{ filters: false }]`.
 *
 * Two locator families live here, and they are scoped differently for different reasons. Cell
 * locators are scoped to one overlay layer, because a pinned row is rendered in the master table
 * AND cloned into its overlay, so the fixture's `cell-<row>-<col>` id exists more than once and an
 * unscoped `getByTestId` would be a strict-mode violation. The dropdown-menu locators cannot carry
 * fixture-stamped ids at all - the menu is grid-internal DOM - so they use the plugin's own class
 * hooks, which a spec never spells out itself.
 */
export class FiltersFixedRowsPage {
  /**
   * The Playwright page the fixture is driven through.
   */
  readonly page: Page;
  /**
   * The active theme, passed through to the fixture URL.
   */
  readonly theme: string;
  /**
   * The active bundle, passed through to the fixture URL.
   */
  readonly bundle: string;
  /**
   * The master table - the only layer that renders every row exactly once.
   */
  readonly master: Locator;
  /**
   * The top overlay, which holds the column headers and the `fixedRowsTop` rows.
   */
  readonly topOverlay: Locator;
  /**
   * The bottom overlay, which holds the `fixedRowsBottom` rows.
   */
  readonly bottomOverlay: Locator;
  /**
   * The open dropdown menu.
   */
  readonly menu: Locator;
  /**
   * One row per item in the "filter by value" list.
   */
  readonly valueList: Locator;
  /**
   * The "Filter by condition" block of the menu.
   */
  readonly conditionBlock: Locator;
  /**
   * The menu's OK / Cancel action bar.
   */
  readonly actionBar: Locator;
  /**
   * Uncaught page errors seen since construction, in the order they fired.
   */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors
   * immediately, so a spec that never calls `goto()` before an assertion still sees them.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.master = page.locator('.ht_master');
    this.topOverlay = page.locator('.ht_clone_top');
    this.bottomOverlay = page.locator('.ht_clone_bottom');
    this.menu = page.locator('.htDropdownMenu');
    this.valueList = this.menu.locator('.htUIMultipleSelect .ht_master .htCore tbody tr');
    this.conditionBlock = this.menu.locator('.htFiltersMenuCondition');
    this.actionBar = this.menu.locator('.htFiltersMenuActionBar');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render - a real DOM condition, never a sleep.
   *
   * The bundle first, or the leg would fail pointing at a cell instead of the real cause. Then wait
   * for the fixture to have finished building, either way, and rethrow a constructor throw with its
   * own message: without that, a failed build reads as a `toBeVisible()` timeout on a cell, which
   * points nowhere near the cause.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/filters-fixed-rows.html?theme=${this.theme}&bundle=${this.bundle}`);

    try {
      await awaitBundle(this.page);

      await this.page.waitForFunction(
        () => 'hot' in window || 'htBuildError' in window,
        undefined,
        { polling: BUNDLE_POLLING_MS }
      );
    } catch (timeoutError) {
      const snapshot = await this.page.evaluate(() => ({
        readyState: document.readyState,
        handsontable: typeof (window as { Handsontable?: unknown }).Handsontable,
        stylesheets: document.styleSheets.length,
      })).catch(() => 'page unreachable');

      throw new Error(`The fixture never built its grid; page snapshot: ${JSON.stringify(snapshot)}`,
        { cause: timeoutError });
    }

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.masterCell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given setting overrides, so one test cannot leak into the next.
   * A constructor throw here surfaces on its own, because `page.evaluate` rejects with it.
   */
  async rebuild(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initFiltersFixedRowsGrid(settings), overrides);
    await expect(this.masterCell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell in the master table, by visual row/column.
   */
  masterCell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A single data cell as the top overlay renders it - only `fixedRowsTop` rows are there.
   */
  topOverlayCell(row: number, col: number): Locator {
    return this.topOverlay.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A single data cell as the bottom overlay renders it - only `fixedRowsBottom` rows are there.
   */
  bottomOverlayCell(row: number, col: number): Locator {
    return this.bottomOverlay.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The values the grid currently holds in a column, top to bottom, pinned rows included.
   */
  async columnValues(col: number): Promise<CellValue[]> {
    return this.page.evaluate(column => window.hot.getDataAtCol(column), col);
  }

  /**
   * Open the dropdown menu of the column with the given header label.
   *
   * Waits only for the menu itself, never for a filter item: a column that opted out of filtering
   * still opens a menu, and waiting for an item there would time out instead of asserting.
   */
  async openMenu(headerLabel: string): Promise<void> {
    await this.topOverlay
      .locator('th')
      .filter({ hasText: new RegExp(`^${headerLabel}$`) })
      .locator('.changeType')
      .click();

    await expect(this.menu).toBeVisible();
  }

  /**
   * Open a column's dropdown menu from the keyboard, the way a user reaches it without the mouse.
   *
   * The keyboard path is the one that exercises the menu's Tab focus navigator, whose focusable
   * items are built once when the plugin is enabled - so a column whose filter components are all
   * hidden is the case worth driving here.
   *
   * @param {number} row Visual row index to select first.
   * @param {number} col Visual column index whose menu opens.
   */
  async openMenuWithKeyboard(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col]);
    await this.page.keyboard.press('Alt+Shift+ArrowDown');

    await expect(this.menu).toBeVisible();
  }

  /**
   * Where the browser focus currently sits, as a short description a spec can assert on.
   *
   * Returns the closest meaningful container rather than the element itself: the menu's own DOM is
   * internal to the plugin, so naming the element would pin markup instead of behavior.
   */
  async focusLocation(): Promise<string> {
    return this.page.evaluate(() => {
      const active = document.activeElement;

      if (!active || active === document.body) {
        return 'nowhere';
      }

      if (!active.isConnected) {
        return 'detached';
      }

      if (active.closest('.htDropdownMenu')) {
        return 'menu';
      }

      if (active.closest('[data-testid="grid"]')) {
        return 'grid';
      }

      return 'elsewhere';
    });
  }

  /**
   * Close the menu with the Escape key and wait for it to go away.
   */
  async escapeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.menu).toBeHidden();
  }

  /**
   * Confirm the menu with the "OK" button and wait for it to close.
   */
  async confirmMenu(): Promise<void> {
    await this.menu.locator('.htUIButtonOK input').click();
    await expect(this.menu).toBeHidden();
  }

  /**
   * The "filter by value" list labels, in display order.
   */
  async listedValues(): Promise<string[]> {
    const labels = await this.valueList.locator('label').allInnerTexts();

    return labels.map(label => label.trim());
  }

  /**
   * Click the "Clear" link, which unchecks every value the list holds.
   */
  async clearAllValues(): Promise<void> {
    await this.menu.locator('.htUIMultipleSelect a', { hasText: /^Clear$/ }).click();

    await expect(this.valueList.first().locator('input[type="checkbox"]')).not.toBeChecked();
  }

  /**
   * Check the "filter by value" item carrying the given label.
   *
   * The value box is virtualized and holds roughly four rows, so a spec targets a row near the top:
   * pressing one at or past the fold makes Playwright scroll the inner list first, the row moves out
   * from under the pointer, and the press lands outside the menu and closes it.
   */
  async checkValue(label: string): Promise<void> {
    const checkbox = this.valueList
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('input[type="checkbox"]');

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }
}
