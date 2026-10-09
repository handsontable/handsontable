import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';
import { type CellValue } from './windowTypes';

/**
 * The label a separator row reports in `conditionOptions()`.
 */
export const SEPARATOR_LABEL = '---';

/**
 * Page object for the DEV-3056 fixture: which operators the "Filter by condition" selects offer,
 * as chosen by `filters.availableConditions` at grid and column level.
 *
 * The dropdown menu and the condition list it opens are grid-internal DOM, so they cannot carry
 * fixture-stamped ids. They are reached through the plugin's own class hooks, which a spec never
 * spells out itself.
 */
export class FiltersAvailableConditionsPage {
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
   * The fixture file to open, relative to `fixtures/demo/`.
   */
  readonly fixture: string;
  /**
   * The top overlay, which holds the column headers.
   */
  readonly topOverlay: Locator;
  /**
   * The open dropdown menu, without the containers of its submenus.
   */
  readonly menu: Locator;
  /**
   * The two "Filter by condition" selects, in menu order.
   */
  readonly conditionSelects: Locator;
  /**
   * The list a condition select opens. Each select owns one container; only the open one shows.
   */
  readonly conditionsMenu: Locator;
  /**
   * Uncaught page errors seen since construction, in the order they fired.
   */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors
   * immediately, so a spec that never calls `goto()` before an assertion still sees them.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd', fixture = 'filters-available-conditions.html') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.fixture = fixture;
    this.topOverlay = page.locator('.ht_clone_top');
    this.menu = page.locator('.htDropdownMenu:not([class*="htDropdownMenuSub_"])');
    this.conditionSelects = this.menu.locator('.htFiltersMenuCondition .htUISelect');
    this.conditionsMenu = page.locator('.htFiltersConditionsMenu:visible');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render - a real DOM condition, never a sleep.
   *
   * The bundle first, or the leg would fail pointing at a cell instead of the real cause. A
   * constructor throw is rethrown with its own message, not left to read as a visibility timeout.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/${this.fixture}?theme=${this.theme}&bundle=${this.bundle}`);

    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'hot' in window || 'htBuildError' in window,
      undefined,
      { polling: BUNDLE_POLLING_MS }
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given setting overrides, so one test cannot leak into the next.
   */
  async rebuild(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initFiltersAvailableConditionsGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell in the master table, by visual row/column.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The values the grid currently holds in a column, top to bottom.
   */
  async columnValues(col: number): Promise<CellValue[]> {
    return this.page.evaluate(column => window.hot.getDataAtCol(column), col);
  }

  /**
   * Adds a condition through the plugin API and runs the filter.
   */
  async filterThroughApi(col: number, name: string, args: unknown[]): Promise<void> {
    await this.page.evaluate(([column, conditionName, conditionArgs]) => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(column as number, conditionName as string, conditionArgs as unknown[]);
      filters.filter();
    }, [col, name, args] as const);
  }

  /**
   * Open the dropdown menu of the column with the given header label.
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
   * The text the given condition select shows as its current value.
   *
   * @param {number} index 0 for the first "Filter by condition" select, 1 for the second.
   */
  conditionCaption(index = 0): Locator {
    return this.conditionSelects.nth(index).locator('.htUISelectCaption');
  }

  /**
   * Open the given condition select and wait for its list.
   *
   * @param {number} index 0 for the first "Filter by condition" select, 1 for the second.
   */
  async openConditionSelect(index = 0): Promise<void> {
    await this.conditionSelects.nth(index).click();
    await expect(this.conditionsMenu).toBeVisible();
  }

  /**
   * The labels of the open condition list, in display order, with separators as `SEPARATOR_LABEL`.
   *
   * Read in one call, so the list cannot re-render between finding the cells and reading them.
   */
  async conditionOptions(): Promise<string[]> {
    return this.conditionsMenu.locator('.ht_master .htCore tbody td').evaluateAll(
      (cells, separator) => cells.map(cell => (
        cell.classList.contains('htSeparator') ? separator : (cell.textContent ?? '').trim()
      )),
      SEPARATOR_LABEL,
    );
  }

  /**
   * Pick a condition by its label in the open condition list.
   */
  async pickCondition(label: string): Promise<void> {
    await this.conditionsMenu.locator('td').filter({ hasText: new RegExp(`^${label}$`) }).click();
    await expect(this.conditionsMenu).toBeHidden();
  }

  /**
   * Type the argument of the first condition.
   */
  async typeConditionValue(value: string): Promise<void> {
    const input = this.menu.locator('.htFiltersMenuCondition .htUIInput input').first();

    await expect(input).toBeVisible();
    await input.fill(value);
  }

  /**
   * The argument inputs of the first "Filter by condition" component, visible ones only.
   */
  conditionInputs(): Locator {
    return this.menu.locator('.htFiltersMenuCondition').first().locator('.htUIInput input:visible');
  }

  /**
   * Confirm the menu with the "OK" button and wait for it to close.
   */
  async confirmMenu(): Promise<void> {
    await this.menu.locator('.htUIButtonOK input').click();
    await expect(this.menu).toBeHidden();
  }
}
