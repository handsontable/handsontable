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
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/mobile-handles.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Tap a cell to select it with a touch gesture.
   */
  async tapCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).tap();
  }

  /**
   * The top-left mobile selection handle of the focus selection, scoped to
   * the master overlay.
   */
  topHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .topSelectionHandle').first();
  }

  /**
   * The bottom-right mobile selection handle of the focus selection, scoped
   * to the master overlay.
   */
  bottomHandle(): Locator {
    return this.page.locator('.ht_master .htBorders .bottomSelectionHandle').first();
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
}
