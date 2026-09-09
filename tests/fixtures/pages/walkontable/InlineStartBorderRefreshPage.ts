import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../../bundle';

/** The two kinds of draw one crossing of horizontal offset 0 costs. */
export interface DrawCounts {
  /** `refreshAll` calls from the scroll event. Must stay >= 1 or the overlays go stale. */
  scrollDriven: number;
  /** Re-entrant `refreshAll` calls, i.e. the 1px-shift reconciliation. Must be 0. */
  reconciliation: number;
}

/** The draws one round trip across horizontal offset 0 costs, per direction. */
export interface DrawsAcrossOffsetZero {
  leavingOffsetZero: DrawCounts;
  returningToOffsetZero: DrawCounts;
}

/**
 * The overlay geometry a dropped refresh would leave stale. No field is nullable: the fixture throws
 * on a selector that does not match, rather than reporting `null` and letting two misses compare
 * equal.
 */
export interface OverlayMetrics {
  rowHeaderWidth: number;
  hiderWidth: string;
  hiderHeight: string;
  masterScrollHeight: number;
  masterScrollWidth: number;
  inlineStartCloneWidth: number;
  topCloneWidth: number;
  cornerCloneWidth: number;
  masterFirstRowTop: number;
  inlineStartFirstRowTop: number;
}

/** The classes the inline-start overlay still stamps for backward compatibility. */
export interface MasterBorderClasses {
  innerBorderInlineStart: boolean;
  innerBorderLeft: boolean;
}

/**
 * Page Object for the inline-start border refresh fixture (DEV-2786 item 2).
 *
 * Everything here is a thin call into a fixture-side helper. The counting and the frame waits live
 * in the fixture on purpose: they have to run inside one browser task sequence, and a spec-side
 * `page.evaluate` per step would let a draw land between the steps.
 */
export class InlineStartBorderRefreshPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly inlineStartOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {object} [options] Fixture options. `colWidths` picks one declared width (`uniform`,
   *   the single-pass layout path) or a per-column array (`varied`, off that path). `scroll` picks
   *   whether the grid scrolls inside its own holder (`element`) or the page scrolls (`window`),
   *   which is the other way off that path, and the one the removed `prepareHeaderBorders` pass
   *   bailed on outright.
   */
  async goto(options: {
    colWidths?: 'uniform' | 'varied',
    scroll?: 'element' | 'window',
  } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([key, value]) => params.set(key, String(value)));

    await this.page.goto(`/tests/fixtures/demo/walkontable/inline-start-border-refresh.html?${params}`);
    // The bundle is injected with `document.write`, separately from the block that installs these
    // helpers, so a visible grid is not proof either has run.
    await awaitBundle(this.page);
    await expect(this.master).toBeVisible();
    await expect(this.inlineStartOverlay).toBeVisible();
  }

  /** Whether this grid takes the single-pass calculator path. */
  async usesSinglePassPath(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as {
      usesSinglePassPath: () => boolean
    }).usesSinglePassPath());
  }

  /** Scroll a column well past the first to the inline start, and wait for the draw. */
  async scrollAwayFromOffsetZero(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      scrollToFarColumn: () => Promise<void>
    }).scrollToFarColumn());
  }

  /** Scroll back to horizontal offset 0, and wait for the draw. */
  async scrollToOffsetZero(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      scrollToColumn: (column: number) => Promise<void>
    }).scrollToColumn(0));
  }

  /**
   * The scroll-driven and reconciliation draws one round trip across offset 0 costs.
   *
   * @param {string} [axis] `horizontal` (the axis this change touches) or `vertical` (the row axis,
   *   which still shifts the layout and still feeds the flag).
   */
  async countDrawsAcrossOffsetZero(axis: 'horizontal' | 'vertical' = 'horizontal'):
  Promise<DrawsAcrossOffsetZero> {
    return this.page.evaluate(which => (window as unknown as {
      countDrawsAcrossOffsetZero: (axis: string) => Promise<DrawsAcrossOffsetZero>
    }).countDrawsAcrossOffsetZero(which), axis);
  }

  /**
   * Crosses horizontal offset 0 on a draw whose cell render is cancelled, with the master's sizes
   * either side of it.
   */
  async crossOffsetZeroWithRenderSkipped(): Promise<{
    skipped: number,
    before: OverlayMetrics,
    after: OverlayMetrics,
  }> {
    return this.page.evaluate(() => (window as unknown as {
      crossOffsetZeroWithRenderSkipped: () => Promise<{
        skipped: number, before: OverlayMetrics, after: OverlayMetrics,
      }>
    }).crossOffsetZeroWithRenderSkipped());
  }

  /** The backward-compatibility classes on `.ht_master`. */
  async masterBorderClasses(): Promise<MasterBorderClasses> {
    return this.page.evaluate(() => (window as unknown as {
      masterBorderClasses: () => MasterBorderClasses
    }).masterBorderClasses());
  }

  /** The overlay sizes and the master/inline-start row alignment. */
  async overlayMetrics(): Promise<OverlayMetrics> {
    return this.page.evaluate(() => (window as unknown as {
      overlayMetrics: () => OverlayMetrics
    }).overlayMetrics());
  }
}
