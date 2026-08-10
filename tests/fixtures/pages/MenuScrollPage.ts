import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the menu-scroll fixture (issue #12719). Encapsulates opening
 * the dropdown/context menus and performing element scrolls (container, grid
 * holder, filter value list) and page scrolls. Waits are web-first assertions.
 */
export class MenuScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly scrollContainer: Locator;
  readonly dropdownMenu: Locator;
  readonly contextMenu: Locator;
  readonly submenu: Locator;
  readonly conditionMenu: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.scrollContainer = page.getByTestId('scroll-container');
    this.dropdownMenu = page.locator('.htDropdownMenu.handsontable:not([class*="Sub_"])');
    this.contextMenu = page.locator('.htContextMenu.handsontable:not([class*="Sub_"])');
    // Any submenu container regardless of parent menu kind.
    this.submenu = page.locator('.htMenu[class*="Sub_"]');
    // The standalone menu opened by the "filter by condition" select. The component
    // builds one (closed, empty) container per condition select — `[role="menu"]`
    // narrows the match to the opened one.
    this.conditionMenu = page.locator('.htFiltersConditionsMenu[role="menu"]');
  }

  /**
   * Navigate to the fixture page.
   *
   * @param {object} [options] Navigation options.
   * @param {boolean} [options.uiContainer] When `true`, renders the dropdown/context menus
   * inside the scrollable container (the `uiContainer` workaround) instead of the default
   * body portal.
   */
  async goto(options: { uiContainer?: boolean } = {}): Promise<void> {
    const { uiContainer = false } = options;
    const uiContainerParam = uiContainer ? '&uicontainer=1' : '';

    await this.page.goto(`/tests/fixtures/demo/menu-scroll.html?theme=${this.theme}${uiContainerParam}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Open the column dropdown menu by clicking the header button of `col`. */
  async openDropdownMenu(col: number): Promise<void> {
    // +1 skips the row-header corner TH.
    await this.grid
      .locator('.ht_clone_top thead th')
      .nth(col + 1)
      .locator('.changeType')
      .click();
    await expect(this.dropdownMenu).toBeVisible();
  }

  /** The "filter by condition" select element inside the open dropdown menu. */
  conditionSelect(): Locator {
    return this.dropdownMenu.locator('.htUISelect').first();
  }

  /** Open the "filter by condition" select menu inside the open dropdown menu. */
  async openConditionSelectMenu(): Promise<void> {
    await this.conditionSelect().click();
    await expect(this.conditionMenu).toBeVisible();
  }

  /** Open the context menu by right-clicking a cell. */
  async openContextMenu(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });
    await expect(this.contextMenu).toBeVisible();
  }

  /** Hover the "Alignment" item of the open context menu until its submenu shows. */
  async openAlignmentSubmenu(): Promise<void> {
    await this.contextMenu.getByText('Alignment', { exact: true }).hover();
    await expect(this.submenu).toBeVisible();
  }

  /** Scroll the outer overflow:auto container (element scroll outside the menu). */
  async scrollContainerBy(px: number): Promise<void> {
    await this.scrollContainer.evaluate((el, delta) => {
      el.scrollTop += delta;
    }, px);
  }

  /** Scroll the grid's own viewport horizontally (the customer-reported case). */
  async scrollGridHorizontallyBy(px: number): Promise<void> {
    await this.grid.locator('.ht_master .wtHolder').evaluate((el, delta) => {
      el.scrollLeft += delta;
    }, px);
  }

  /** Scroll the grid's own viewport vertically. */
  async scrollGridVerticallyBy(px: number): Promise<void> {
    await this.grid.locator('.ht_master .wtHolder').evaluate((el, delta) => {
      el.scrollTop += delta;
    }, px);
  }

  /** Scroll the "filter by value" list INSIDE the open dropdown menu. */
  async scrollFilterValueListBy(px: number): Promise<void> {
    await this.dropdownMenu
      .locator('.htUIMultipleSelectHot .ht_master .wtHolder')
      .evaluate((el, delta) => {
        el.scrollTop += delta;
      }, px);
  }

  /** Scroll the window/page itself (must NOT close the menu). */
  async scrollPageBy(px: number): Promise<void> {
    await this.page.evaluate((delta) => {
      window.scrollBy(0, delta);
    }, px);
  }

  /**
   * Let two rendering updates pass so any pending element `scroll` events have
   * fired and been handled. Deterministic (rAF-based) — not a timeout.
   */
  async settleFrames(): Promise<void> {
    await this.page.evaluate(
      () => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
    );
  }

  /** The dropdown button of column `col`'s header (row-header TH is index 0). */
  headerButton(col: number): Locator {
    return this.grid
      .locator('.ht_clone_top thead th')
      .nth(col + 1)
      .locator('.changeType');
  }

  /** Bounding box of a locator, failing loudly instead of returning null. */
  async boundingBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
    const box = await locator.boundingBox();

    if (!box) {
      throw new Error('Expected element to have a bounding box (is it visible?)');
    }

    return box;
  }
}
