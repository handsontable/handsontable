import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the mobile selection handles fixture (DEV-2165).
 *
 * The spec using this page object must run with touch + mobile user agent
 * emulation (`test.use({ hasTouch: true, ... })`) — Handsontable decides
 * whether to create the selection handles from the user agent at grid
 * construction time.
 */
export class MobileHandlesPage {
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
   * Navigate to the fixture and wait for the grid to render. Frozen panes are off by default, and
   * headers are on, which is the configuration most grids run with.
   */
  async goto({ direction = 'ltr', frozen = false, frozenBottom = false, headers = true, rows = 'short' }: {
    direction?: 'ltr' | 'rtl';
    frozen?: boolean;
    frozenBottom?: boolean;
    headers?: boolean;
    rows?: 'short' | 'tall';
  } = {}): Promise<void> {
    const query = new URLSearchParams({
      theme: this.theme,
      bundle: this.bundle,
      direction,
      frozen: frozen ? '1' : '0',
      frozenBottom: frozenBottom ? '2' : '0',
      headers: headers ? 'on' : 'off',
      rows,
    });

    await this.page.goto(`/tests/fixtures/demo/mobile-handles.html?${query}`);
    await expect(this.cell(1, 1)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Tap a cell to select it with a touch gesture.
   */
  async tapCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).tap();
  }

  /**
   * Extends the current selection while preserving its top-left corner.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(
      range => window.hot.selectCell(range.fromRow, range.fromCol, range.toRow, range.toCol),
      { fromRow, fromCol, toRow, toCol }
    );
  }

  /**
   * The top-left mobile selection handle of the focus selection, scoped to
   * the master overlay.
   */
  topHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .topSelectionHandle:visible').first();
  }

  /**
   * The bottom-right mobile selection handle of the focus selection, scoped
   * to the master overlay.
   */
  bottomHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .bottomSelectionHandle:visible').first();
  }

  /**
   * Assert both mobile selection handles are attached and visible with a
   * non-zero rendered size.
   */
  async expectHandlesVisible(): Promise<void> {
    await expect(this.topHandle()).toBeVisible();
    await expect(this.bottomHandle()).toBeVisible();

    for (const handle of [this.topHandle(), this.bottomHandle()]) {
      const box = await handle.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    }
  }

  /**
   * Returns whether the top handle owns the pixels at the center of its visible marker.
   */
  async isTopHandleHitAreaAtHandleCenter(): Promise<boolean> {
    return this.topHandle().evaluate((handle) => {
      const { left, top, width, height } = handle.getBoundingClientRect();
      const element = document.elementFromPoint(left + (width / 2), top + (height / 2));

      return element?.closest('.topSelectionHandle-HitArea') !== null;
    });
  }

  /**
   * Returns whether the bottom handle owns the pixels at the center of its visible marker.
   */
  async isBottomHandleHitAreaAtHandleCenter(): Promise<boolean> {
    return this.bottomHandle().evaluate((handle) => {
      const { left, top, width, height } = handle.getBoundingClientRect();
      const element = document.elementFromPoint(left + (width / 2), top + (height / 2));

      return element?.closest('.bottomSelectionHandle-HitArea') !== null;
    });
  }

  /**
   * Returns whether the top handle hangs off the cell's outer corner (LTR), which is where it
   * belongs whenever no overlay clone renders over that corner. The corner placement leaves the
   * handle touching the cell edge, while the clone placement moves it a full handle inside, so
   * half a handle separates the two.
   */
  async isTopHandleOnCellOuterCorner(row: number, col: number): Promise<boolean> {
    const handleBox = await this.topHandle().boundingBox();
    const cellBox = await this.cell(row, col).boundingBox();

    if (!handleBox || !cellBox) {
      return false;
    }

    return handleBox.y + handleBox.height <= cellBox.y + (handleBox.height / 2)
      && handleBox.x + handleBox.width <= cellBox.x + (handleBox.width / 2);
  }
}
