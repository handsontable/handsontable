import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Page object for `fixtures/demo/nested-headers-grown-widths.html`, a 600 x 300 grid of 26 narrow
 * columns under nested headers wider than their data.
 */
export class NestedHeadersGrownWidthsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly holder: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.holder = page.locator('.ht_master .wtHolder');
  }

  /**
   * Opens the fixture.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-headers-grown-widths.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.holder).toBeVisible();
  }

  /**
   * Scrolls the master holder to its far right edge.
   */
  async scrollToEnd(): Promise<void> {
    await this.holder.evaluate((holder) => {
      holder.scrollLeft = holder.scrollWidth;
    });
  }

  /**
   * How far the last column's cell sits from the holder's visible area, in pixels: 0 when the cell
   * lies inside it, positive when it is cut off or scrolled out of view (the blank area).
   *
   * @returns {Promise<number>} The distance, or `Infinity` when the last column is not rendered.
   */
  async lastColumnOffscreenBy(): Promise<number> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: { countCols(): number; getCell(r: number, c: number): HTMLElement | null } }).hot;
      const cell = hot.getCell(0, hot.countCols() - 1);

      if (!cell) {
        return Infinity;
      }

      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const box = cell.getBoundingClientRect();
      const view = holder.getBoundingClientRect();

      return Math.max(0, view.left - box.left, box.right - view.right);
    });
  }
}
