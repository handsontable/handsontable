import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the window-scrolled half of the column-header border-ownership fixture: one grid
 * with no `width` and no `height`, so the WINDOW owns both axes.
 *
 * It exists because the element-scroll fixture cannot observe a bottom-edge scroll target at all.
 * There the browser clamps `scrollTop` to the holder's own range, so an overshooting target is
 * absorbed silently; here nothing clamps it, which is the only shape where the target can be
 * compared against the viewport.
 */
export class ColumnHeaderWindowScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('window-scroll');
    this.master = this.grid.locator('.ht_master table.htCore');
  }

  /**
   * Navigate and wait for the grid to render - a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-header-window-scroll.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.master.locator('tbody > tr').first()).toBeVisible();
  }

  /**
   * Whether the window really owns the vertical axis. The premise of every assertion here: with an
   * element-owned axis the browser clamps the scroll and the overshoot is unobservable.
   *
   * @returns {Promise<boolean>}
   */
  async windowOwnsVerticalAxis(): Promise<boolean> {
    return this.page.evaluate(() => {
      const overlay = (window as any).hot.view._wt.wtOverlays.topOverlay;

      return overlay.trimmingContainer === window;
    });
  }

  /**
   * Snaps a row to the viewport's BOTTOM edge, which is the branch of `TopOverlay#scrollTo` that
   * carries the `newY += 1` overshoot, and waits for the scroll to settle.
   *
   * @param {number} row The visual row index.
   */
  async scrollRowToBottomEdge(row: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as any).scrollRowToBottomEdge(target);
    }, row);

    // The scroll is applied synchronously but the redraw it triggers is coalesced into a later
    // animation frame, so wait for the offset to stop moving rather than reading straight after.
    await expect.poll(async() => {
      const first = await this.page.evaluate(() => window.scrollY);

      await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      })));

      return await this.page.evaluate(() => window.scrollY) === first;
    }).toBe(true);
  }

  /**
   * Where a row sits relative to the viewport, and how much of it is outside.
   *
   * @param {number} row The visual row index.
   * @returns {Promise<{ top: number, bottom: number, viewportHeight: number, clippedBelow: number,
   *   clippedAbove: number }>}
   */
  async rowAgainstViewport(row: number) {
    return this.page.evaluate((target) => {
      const cell = (window as any).hot.getCell(target, 0) as HTMLElement;

      if (!cell) {
        throw new Error(`row ${target} is not rendered`);
      }

      const rect = cell.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;

      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        viewportHeight,
        clippedBelow: Math.max(0, Math.round(rect.bottom - viewportHeight)),
        clippedAbove: Math.max(0, Math.round(0 - rect.top)),
      };
    }, row);
  }

  /**
   * The column header's own height and the borders it draws, read from the last head row.
   *
   * @returns {Promise<{ height: number, borderTop: number, borderBottom: number }>}
   */
  async headerMetrics() {
    return this.page.evaluate(() => {
      const th = document.querySelector(
        '[data-testid="window-scroll"] .ht_master table.htCore > thead > tr:last-child > th'
      ) as HTMLElement;
      const style = getComputedStyle(th);

      return {
        height: Math.round(th.getBoundingClientRect().height),
        borderTop: parseInt(style.borderTopWidth, 10),
        borderBottom: parseInt(style.borderBottomWidth, 10),
      };
    });
  }

  /** The first body row's own `border-top`, which the head row above it now owns. */
  async firstBodyRowBorderTop(): Promise<number> {
    return this.master.locator('tbody > tr').first().locator('td').first()
      .evaluate(element => parseInt(getComputedStyle(element).borderTopWidth, 10));
  }
}
