import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the row-height-device-scale fixture (#6280): an auto-height grid with
 * every row rendered and an element directly beneath it. Exposes the two edges the defect
 * pulled apart — the grid's own scroll range against the last row it holds, and the
 * row-header clone's scroll box against its own last row.
 *
 * Every measurement is a `getBoundingClientRect()` read, so it stays correct for rows that
 * sit below the fold: the grid is far taller than the window here, and scrolling it into
 * view would only add a source of flake.
 */
export class RowHeightDeviceScalePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate at a given zoom and wait for the grid to render a cell (a real DOM condition,
   * no sleep). The fixture applies the zoom before constructing the grid.
   *
   * @param zoom The CSS zoom to render the page at. Below 1 reproduces the defect.
   */
  async goto(zoom = 1): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-height-device-scale.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&zoom=${zoom}`
    );
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.lastRow()).toBeAttached();
  }

  /**
   * A data cell in the grid's master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The last row of the master table. Virtualization is off in the fixture, so this is the
   * last row of the data rather than the last one near the viewport.
   */
  lastRow(): Locator {
    return this.page.getByTestId('grid').locator('.ht_master table.htCore tbody tr').last();
  }

  /**
   * The theme the grid actually resolved, read from the instance rather than from the DOM.
   *
   * Linking a theme's stylesheet does not apply it — every rule is scoped to an `ht-theme-*` class on
   * the container. Without that class all three theme legs render the built-in default and quietly
   * test one configuration six times over.
   */
  async activeTheme(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getCurrentThemeName(): string },
    }).hot.getCurrentThemeName());
  }

  /**
   * The width the browser actually paints a cell's bottom border at.
   *
   * The suite asserts this before anything else. It is the mechanism the whole defect rests
   * on: the border is declared 1px, and only a browser rendering below 100% reports more.
   * Were the zoom not to apply, every geometry assertion below would pass for the wrong
   * reason, on code that still has the bug.
   */
  async cellBorderBottomWidth(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const cell = grid.querySelector('.ht_master table.htCore tbody td') as HTMLElement;

      return Number.parseFloat(getComputedStyle(cell).borderBottomWidth);
    });
  }

  /**
   * How far the last row's bottom edge sits below the grid's own scroll range.
   *
   * Positive means the grid renders taller than the box it reports, so the rows spill onto
   * whatever follows the grid. This is the number that grew by ~0.1px per row at 90% zoom.
   */
  async rowOverflowBelowGrid(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const hider = grid.querySelector('.ht_master .wtHider') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_master table.htCore tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;

      return lastRow.getBoundingClientRect().bottom - hider.getBoundingClientRect().bottom;
    });
  }

  /**
   * How much of the row-header clone's last row its own scroll box cuts off.
   *
   * Positive means the bottom row numbers are clipped away — the visible half of this
   * defect. The clone's rows never drift from the master's; it is the box around them that
   * came up short.
   */
  async rowHeaderClipped(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_clone_inline_start table.htCore tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;
      const holder = grid.querySelector('.ht_clone_inline_start .wtHolder') as HTMLElement;

      return lastRow.getBoundingClientRect().bottom - holder.getBoundingClientRect().bottom;
    });
  }

  /**
   * The gap between the grid's last row and the element placed under the grid. Negative
   * means the grid overlaps that element.
   */
  async gapToElementBelow(): Promise<number> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const rows = grid.querySelectorAll('.ht_master table.htCore tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;
      const below = document.querySelector('[data-testid="below"]') as HTMLElement;

      return below.getBoundingClientRect().top - lastRow.getBoundingClientRect().bottom;
    });
  }
}
