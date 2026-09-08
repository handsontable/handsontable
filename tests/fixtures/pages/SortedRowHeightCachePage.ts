import { type Page, expect } from '@playwright/test';

interface GapProbe {
  gapTop: number;
  gapBottom: number;
}

/**
 * Page Object for the `sorted-row-height-cache` fixture (DEV-2823). The grid declares no `height`,
 * so the WINDOW scrolls. Every probe reads the fixture's own globals rather than DOM structure.
 */
export class SortedRowHeightCachePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the bundle, the fixture helpers, and the first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/sorted-row-height-cache.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before the cell. The test id comes from the fixture's renderer, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await this.page.waitForFunction(() => (window as unknown as { htReady?: boolean }).htReady === true);

    await expect(this.page.locator('.ht_master').getByTestId('cell-0-0')).toBeVisible();

    // `autoRowSize` measures rows in the background, so the scroll range keeps growing for a moment
    // after the first paint. Settle on a stable document height before measuring anything.
    await this.waitForStableScrollRange();
  }

  /**
   * Sorts the text column through the plugin API. The regression is about the sorted STATE, not
   * about how the sort was triggered, and driving it directly keeps the spec off the header-press
   * path that ManualColumnMove and ColumnSorting share.
   *
   * @param {'asc'|'desc'} order The sort order to apply.
   */
  async sortByText(order: 'asc' | 'desc'): Promise<void> {
    await this.page.evaluate(([sortOrder]) => {
      (window as unknown as { hot: { getPlugin: (name: string) => { sort: (cfg: unknown) => void } } })
        .hot.getPlugin('columnSorting').sort({ column: 1, sortOrder });
    }, [order]);

    await this.waitForStableScrollRange();
  }

  /**
   * Waits until the page's scroll range stops changing, which is how a caller knows `autoRowSize`
   * has finished measuring and the row-height cache has settled.
   */
  async waitForStableScrollRange(): Promise<void> {
    await this.page.waitForFunction(() => {
      const w = window as unknown as { __htLastHeight?: number, __htStableFor?: number };
      const height = document.documentElement.scrollHeight;

      if (w.__htLastHeight === height) {
        w.__htStableFor = (w.__htStableFor ?? 0) + 1;
      } else {
        w.__htLastHeight = height;
        w.__htStableFor = 0;
      }

      return (w.__htStableFor ?? 0) >= 3;
    }, null, { timeout: 15000 });

    await this.page.evaluate(() => {
      const w = window as unknown as { __htLastHeight?: number, __htStableFor?: number };

      w.__htLastHeight = undefined;
      w.__htStableFor = undefined;
    });
  }

  /**
   * The blank space currently visible, in pixels: the largest of the gaps above and below the
   * painted table.
   */
  async blankSpace(): Promise<number> {
    const probe = await this.page.evaluate(() => (window as unknown as { htGap: () => GapProbe }).htGap());

    return Math.max(probe.gapTop, probe.gapBottom);
  }

  /**
   * Scrolls the window down one step, resolving on the second animation frame so the scroll has
   * been through a paint.
   *
   * @param {number} stepPx How far to scroll.
   */
  async scrollStep(stepPx: number): Promise<void> {
    await this.page.evaluate(distance => new Promise<void>((resolve) => {
      window.scrollBy(0, distance);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }), stepPx);
  }

  /**
   * Scrolls the window down in steps and asserts that no blank space is left behind at any of them.
   *
   * The step size matters: the regression only shows on INCREMENTAL scrolling, because a single
   * jump to the same offset recomputes the band from scratch and hides it.
   *
   * Each step polls rather than asserting once. A gap measured immediately after a scroll can be
   * ordinary asynchronous render lag, which CLEARS on the next draw; the stale row-height cache
   * never clears, so it is the poll timing out that identifies the regression.
   *
   * @param {number} steps How many scroll steps to take.
   * @param {number} stepPx How far to scroll on each step.
   */
  async expectNoBlankSpaceWhileScrolling(steps: number, stepPx: number): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));

    for (let i = 0; i < steps; i += 1) {
      await this.scrollStep(stepPx);

      await expect
        .poll(() => this.blankSpace(), {
          timeout: 3000,
          message: `blank space below the rendered rows after scroll step ${i + 1}`,
        })
        .toBeLessThanOrEqual(4);
    }
  }
}
