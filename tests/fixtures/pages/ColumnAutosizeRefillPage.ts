import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the column-autosize-viewport-refill fixture (#6452 / DEV-406): a 320px-tall
 * grid whose column C starts 40px wide with wrapped, tall rows 1-7. Encapsulates the resize-handle
 * double-click, the "shorten texts" data change, and the "does the rendered band fill the
 * viewport" measurement.
 */
export class ColumnAutosizeRefillPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/column-autosize-viewport-refill.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master table, by visual row/column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The rows currently rendered in the master TBODY (the virtualized band, not the data length).
   */
  async renderedRowCount(): Promise<number> {
    return this.grid.locator('.ht_master tbody tr').count();
  }

  /**
   * Rendered width of a column header cell in the top (header) clone.
   */
  async columnHeaderWidth(col: number): Promise<number> {
    const box = await this.columnHeader(col).boundingBox();

    return box?.width ?? 0;
  }

  /**
   * Double-click the resize handle on the end edge of a column header, which the
   * ManualColumnResize plugin turns into an autosize of that column.
   */
  async autosizeColumnByDoubleClick(col: number): Promise<void> {
    const header = this.columnHeader(col);
    const box = await header.boundingBox();

    if (!box) {
      throw new Error(`Column header ${col} has no bounding box`);
    }

    // A raw pointer move, not `locator.hover()`: hovering near the end edge is what makes the
    // plugin append and position `.manualColumnResizer` right under the pointer, and `hover()`
    // then re-runs its hit-target actionability check, which now finds that handle covering the
    // TH and treats it as an obstruction — retrying forever. `mouse.move` performs no such check.
    // 3px inside the end edge, not on it: the point must still land on the TH itself, so the
    // `mouseover` reaches the header cell rather than its border or the neighboring column.
    await this.page.mouse.move(box.x + box.width - 3, box.y + box.height / 2);

    const handle = this.page.locator('.manualColumnResizer');

    await expect(handle).toBeVisible();
    await handle.dblclick();
  }

  /**
   * Replace the long wrapped sentences with a short value through the fixture's button.
   */
  async shortenTexts(): Promise<void> {
    await this.page.getByTestId('shorten-texts').click();
    await expect(this.cell(1, 2)).toHaveText('short');
  }

  /**
   * Assert the rendered band reaches the bottom of the scrollable holder — the viewport shows
   * rows all the way down, not a blank area after the last rendered row. Also cross-checks that
   * the DOM band is at least as long as the fully-visible row count the engine itself reports
   * (`countVisibleRows`), which was correct even while the DOM lagged behind.
   */
  async expectViewportFilled(): Promise<void> {
    await expect.poll(async () => (await this.probe()).gap, {
      message: 'rendered rows should reach the bottom of the viewport',
    }).toBeLessThanOrEqual(20); // a horizontal scrollbar may occupy the bottom of the holder; 20px covers every theme.

    await expect.poll(async () => {
      const { rendered, visible } = await this.probe();

      return rendered >= visible;
    }, {
      message: 'rendered row count should be at least the fully-visible row count the engine reports',
    }).toBe(true);
  }

  /**
   * Column header cell in the top clone (where the resize handle attaches).
   */
  private columnHeader(col: number): Locator {
    return this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(col);
  }

  /**
   * Single measurement of the rendered band vs. the viewport. The three fields are read in one
   * `page.evaluate`, so they describe the same frame; each `expect.poll` above calls `probe()`
   * independently, so the two assertions read separate frames. Returns `gap: Infinity` (never
   * satisfies the `toBeLessThanOrEqual` assertion) when no rows are rendered yet, instead of
   * throwing on a missing last row.
   */
  private async probe(): Promise<{ gap: number; rendered: number; visible: number }> {
    return this.page.evaluate(() => {
      const master = document.querySelector('[data-testid="grid"] .ht_master') as HTMLElement;
      const holder = master.querySelector('.wtHolder') as HTMLElement;
      const rows = master.querySelectorAll('tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement | undefined;

      if (!lastRow) {
        return { gap: Number.POSITIVE_INFINITY, rendered: 0, visible: 0 };
      }

      const gap = holder.getBoundingClientRect().bottom - lastRow.getBoundingClientRect().bottom;
      const hot = (window as unknown as { hot: { countVisibleRows(): number } }).hot;

      return { gap, rendered: rows.length, visible: hot.countVisibleRows() };
    });
  }
}
