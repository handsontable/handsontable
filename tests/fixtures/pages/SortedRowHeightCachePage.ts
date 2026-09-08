import { type Page, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

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
    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => (window as unknown as { htReady?: boolean }).htReady === true,
      undefined,
      { polling: BUNDLE_POLLING_MS }
    );

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
   *
   * The budget is deliberately small: several of these run per test against a 20s test timeout, so
   * a generous one here would surface as a locationless "Test timeout" instead of this wait's own
   * failure. `autoRowSize` measures in chunks, so the settle needs consecutive equal readings rather
   * than a single one — three at the 100ms poll, so about 300ms of an unchanging scroll range.
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
    }, undefined, { timeout: 4000, polling: 100 });

    await this.page.evaluate(() => {
      const w = window as unknown as { __htLastHeight?: number, __htStableFor?: number };

      w.__htLastHeight = undefined;
      w.__htStableFor = undefined;
    });
  }

  /**
   * Sorts the text column the way a user does: a click on the header LABEL. Since #13184 sorting
   * fires on mouse up over the label (and its sort indicator) only, so a press anywhere else in the
   * header does not sort.
   */
  async sortByHeaderClick(): Promise<void> {
    const label = this.page.locator('.ht_clone_top thead th').nth(1).locator('span.colHeader');

    await label.click();
    await expect(label).toHaveClass(/ascending|descending/);

    await this.waitForStableScrollRange();
  }

  /**
   * The heights the grid currently reports for the first `count` rows.
   *
   * @param {number} count How many rows to read.
   */
  async rowHeights(count: number): Promise<number[]> {
    return this.page.evaluate(
      n => (window as unknown as { htRowHeights: (c: number) => number[] }).htRowHeights(n),
      count
    );
  }

  /**
   * How far the cached offset for an axis has drifted from the sizes the grid reports now, in
   * pixels. Zero means the cache describes the current layout.
   *
   * @param {'row'|'column'} axis Which axis to measure.
   * @param {number} count How many leading tracks to sum.
   */
  async offsetDrift(axis: 'row' | 'column', count: number): Promise<number> {
    return this.page.evaluate(
      ([a, n]) => (window as unknown as {
        htOffsetDrift: (x: string, c: number) => number,
      }).htOffsetDrift(a as 'row' | 'column', n as number),
      [axis, count] as [string, number]
    );
  }

  /**
   * How many rows are currently renderable. This is the number `PositionCache#isCurrent()` compares,
   * so a spec asserts it is UNCHANGED across a swap to prove the swap really is same-count — without
   * that check the swap can quietly become an ordinary hide, which the count alone would invalidate.
   */
  async renderableRowCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { rowIndexMapper: { getRenderableIndexesLength: () => number } },
    }).hot.rowIndexMapper.getRenderableIndexesLength());
  }

  /**
   * Hides one row on its own, which changes how many rows are renderable.
   *
   * @param {number} row The row to hide.
   */
  async hideRow(row: number): Promise<void> {
    await this.page.evaluate((target) => {
      const hot = (window as unknown as {
        hot: {
          batchExecution: (fn: () => void, flush: boolean) => void,
          getPlugin: (n: string) => { hideRow: (r: number) => void },
        },
      }).hot;

      hot.batchExecution(() => hot.getPlugin('hiddenRows').hideRow(target), true);
    }, row);
  }

  /**
   * Hides one row and shows another in a single batch, so the number of renderable rows is
   * unchanged while WHICH rows are excluded changes.
   *
   * Pass two DIFFERENT rows, and pass a `show` row that is currently hidden. Hiding and showing the
   * same row cancels out, and showing an already-visible row makes this a plain hide — either way
   * the count moves and the case under test is not exercised.
   *
   * @param {number} hide The row to hide.
   * @param {number} show The row to show.
   */
  async swapHiddenRows(hide: number, show: number): Promise<void> {
    await this.page.evaluate(([toHide, toShow]) => {
      const hot = (window as unknown as {
        hot: {
          batchExecution: (fn: () => void, flush: boolean) => void,
          getPlugin: (n: string) => { hideRow: (r: number) => void, showRow: (r: number) => void },
        },
      }).hot;
      const plugin = hot.getPlugin('hiddenRows');

      hot.batchExecution(() => {
        plugin.hideRow(toHide);
        plugin.showRow(toShow);
      }, true);
    }, [hide, show]);
  }

  /**
   * Trims one row on its own, which changes how many rows are renderable.
   *
   * Trimming raises `trimmedIndexesChanged`, a different flag from the one hiding raises, so the
   * two need separate coverage.
   *
   * @param {number} row The row to trim.
   */
  async trimRow(row: number): Promise<void> {
    await this.page.evaluate((target) => {
      const hot = (window as unknown as {
        hot: {
          batchExecution: (fn: () => void, flush: boolean) => void,
          getPlugin: (n: string) => { trimRow: (r: number) => void },
        },
      }).hot;

      hot.batchExecution(() => hot.getPlugin('trimRows').trimRow(target), true);
    }, row);
  }

  /**
   * Trims one row and untrims another in a single batch, so the number of renderable rows is
   * unchanged while WHICH rows are excluded changes. Pass an `untrim` row that is currently trimmed,
   * or the count moves and the case under test is not exercised.
   *
   * @param {number} trim The row to trim.
   * @param {number} untrim The row to untrim.
   */
  async swapTrimmedRows(trim: number, untrim: number): Promise<void> {
    await this.page.evaluate(([toTrim, toUntrim]) => {
      const hot = (window as unknown as {
        hot: {
          batchExecution: (fn: () => void, flush: boolean) => void,
          getPlugin: (n: string) => { trimRow: (r: number) => void, untrimRow: (r: number) => void },
        },
      }).hot;
      const plugin = hot.getPlugin('trimRows');

      hot.batchExecution(() => {
        plugin.untrimRow(toUntrim);
        plugin.trimRow(toTrim);
      }, true);
    }, [trim, untrim]);
  }

  /**
   * Moves a column, which permutes the width axis without changing the column count.
   *
   * @param {number} from The column to move.
   * @param {number} to Its target index.
   */
  async moveColumn(from: number, to: number): Promise<void> {
    await this.page.evaluate(([source, target]) => {
      (window as unknown as {
        hot: { getPlugin: (n: string) => { moveColumn: (a: number, b: number) => void }, render: () => void },
      }).hot.getPlugin('manualColumnMove').moveColumn(source, target);
    }, [from, to]);
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
