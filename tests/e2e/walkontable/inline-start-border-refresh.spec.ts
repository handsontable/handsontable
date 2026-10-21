import { test, expect } from '../../fixtures/test';
import { InlineStartBorderRefreshPage } from '../../fixtures/pages/walkontable/InlineStartBorderRefreshPage';

/**
 * DEV-2786 item 2 - the dead `positionChanged` report on the inline-start axis.
 *
 * `InlineStartOverlay#resetFixedPosition` reported a position change whenever it toggled
 * `innerBorderInlineStart`, and the draw cycle ORed that into `positionChanged`, whose only job is
 * to reconcile a 1px layout shift. Since #6673 the class shifts nothing: the row header carries its
 * inline-end border at every scroll position and no cell behind it carries an inline-start border.
 * So every scroll crossing horizontal offset 0 ran `refreshAll()` - a nested `wot.draw(true)` over
 * the master and every clone - for a shift that cannot happen.
 *
 * Nothing about this is visible: `refreshAll` re-renders the cells the draw already rendered, so the
 * grid looks identical either way. The draw count is the observable contract, which is why these
 * assertions count rather than measure. The geometry assertions are the other half - dropping the
 * report must not drop a refresh some overlay actually needed.
 */
test.describe('walkontable inline-start header border refresh', { tag: '@walkontable' }, () => {
  let wt: InlineStartBorderRefreshPage;

  test.describe('with one declared column width (the single-pass layout path)', () => {
    test.beforeEach(async ({ page, theme, bundle }) => {
      wt = new InlineStartBorderRefreshPage(page, theme, bundle);
      await wt.goto({ colWidths: 'uniform' });
    });

    test('takes the single-pass calculator path', async () => {
      // The premise that separates this block from the varied one. Without it both would measure the
      // same path and the varied block would prove nothing.
      expect(await wt.usesSinglePassPath()).toBe(true);
    });

    test('costs no reconciliation draw when the grid crosses horizontal offset 0', async () => {
      // A CONTROL, not the regression: this configuration already cost nothing when the file was
      // written, because `prepareHeaderBorders` applied the class before the cells rendered and the
      // post-render toggle then found it already in place and reported no change. That machinery is
      // gone now, but the leg stays: it shows the scroll-driven refresh is still counted on a path
      // that never reconciled, so a zero in the varied block below cannot be read as the counter
      // being broken.
      const draws = await wt.countDrawsAcrossOffsetZero();

      expect(draws.leavingOffsetZero.reconciliation).toBe(0);
      expect(draws.returningToOffsetZero.reconciliation).toBe(0);
      expect(draws.leavingOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
      expect(draws.returningToOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
    });
  });

  // There are two ways off the single-pass path, and both used to pay the reconciliation, so both
  // get a leg. A `colWidths` array breaks the uniform-size requirement. Window scrolling breaks the
  // element-mode requirement, and it was the harsher of the two: `prepareHeaderBorders` bailed
  // outright on `trimmingContainer === rootWindow`, so that shape could never have had its class
  // pre-applied whatever the other settings said. Both legs stay now that the pre-render pass is
  // gone - they are the two shapes that paid, so they are the two that must read zero.
  test.describe('with the window as the scroll container (off the single-pass layout path)', () => {
    test.beforeEach(async ({ page, theme, bundle }) => {
      wt = new InlineStartBorderRefreshPage(page, theme, bundle);
      await wt.goto({ colWidths: 'uniform', scroll: 'window' });
    });

    test('drops off the single-pass calculator path', async () => {
      // Uniform widths here, so the gate can only be failing on the window-mode term.
      expect(await wt.usesSinglePassPath()).toBe(false);
    });

    test('costs no reconciliation draw when the grid crosses horizontal offset 0', async () => {
      const draws = await wt.countDrawsAcrossOffsetZero();

      expect(draws.leavingOffsetZero.reconciliation).toBe(0);
      expect(draws.returningToOffsetZero.reconciliation).toBe(0);
      expect(draws.leavingOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
      expect(draws.returningToOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
    });

    test('keeps stamping the backward-compatibility classes on the master', async () => {
      expect(await wt.masterBorderClasses())
        .toEqual({ innerBorderInlineStart: false, innerBorderLeft: false });

      await wt.scrollAwayFromOffsetZero();

      expect(await wt.masterBorderClasses())
        .toEqual({ innerBorderInlineStart: true, innerBorderLeft: true });

      await wt.scrollToOffsetZero();

      expect(await wt.masterBorderClasses())
        .toEqual({ innerBorderInlineStart: false, innerBorderLeft: false });
    });
  });

  test.describe('with a colWidths array (off the single-pass layout path)', () => {
    test.beforeEach(async ({ page, theme, bundle }) => {
      wt = new InlineStartBorderRefreshPage(page, theme, bundle);
      await wt.goto({ colWidths: 'varied' });
    });

    test('drops off the single-pass calculator path', async () => {
      // `usesLayoutSnapshotForCalculators` needs uniform column widths, so an array takes the grid
      // off the pre-render border path - which is the shape that paid twice per crossing.
      expect(await wt.usesSinglePassPath()).toBe(false);
    });

    test('costs no reconciliation draw when the grid crosses horizontal offset 0', async () => {
      // THE regression assertion, together with its twin in the window-mode block. Off the
      // single-pass path the class is toggled after the cells render, so the overlay reported a
      // position change and the draw ran the 1px reconciliation: one re-entrant `refreshAll` on each
      // crossing, a full nested draw over the master and every clone, for a shift that cannot happen
      // since #6673. This is the assertion that fails without the source change.
      const draws = await wt.countDrawsAcrossOffsetZero();

      expect(draws.leavingOffsetZero.reconciliation).toBe(0);
      expect(draws.returningToOffsetZero.reconciliation).toBe(0);

      // The scroll itself must still refresh the overlays - the cost that was removed is the nested
      // one, not this one.
      expect(draws.leavingOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
      expect(draws.returningToOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
    });

    test('costs no reconciliation draw on a VERTICAL crossing either', async () => {
      // This expectation was `toBe(1)` when the file was written, and deliberately so: it was the
      // positive assertion that kept the rest from passing vacuously, because the row axis still
      // shifted the layout by 1px and still fed `ctx.positionChanged`. DEV-2786 brought that axis
      // into line - the column header carries its `border-bottom` at every scroll position, the flag
      // and its branch are gone - so it is 0 like the others now, as the note here predicted.
      //
      // What keeps this file non-vacuous instead is the walkontable spec that owns the row axis
      // (`overlay.spec.js`, "should keep the column header height and run no nested re-draw when
      // crossing the top edge"): it asserts the header's height is unchanged across the same
      // crossing, which fails if the border is traded again.
      const draws = await wt.countDrawsAcrossOffsetZero('vertical');

      expect(draws.leavingOffsetZero.reconciliation).toBe(0);
      expect(draws.returningToOffsetZero.reconciliation).toBe(0);

      expect(draws.leavingOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
      expect(draws.returningToOffsetZero.scrollDriven).toBeGreaterThanOrEqual(1);
    });

    test('leaves the master sizes alone when the crossing draw skips its render', async () => {
      // The one shape the metrics above cannot reach: they come only from draws that rendered. A
      // skipped draw used to reach the master `adjustElementsSize()` only when the `positionChanged`
      // branch ran; DEV-2786 removed that branch and hoisted the call into the skip path, so every
      // skipped draw now sizes the master. This is where a size that moved would show up.
      const { skipped, before, after } = await wt.crossOffsetZeroWithRenderSkipped();

      // Precondition. Without it the rest passes on a draw that rendered normally.
      expect(skipped).toBeGreaterThanOrEqual(1);

      // Only the size fields: a skipped render rolls the rendered band back, so row offsets within
      // the table legitimately differ. A horizontal crossing changes no master size since #6673, so
      // the now-unconditional `adjustElementsSize()` has to be a no-op here - which is what makes
      // running it on every skipped draw safe.
      expect(after.hiderWidth).toBe(before.hiderWidth);
      expect(after.hiderHeight).toBe(before.hiderHeight);
      expect(after.masterScrollWidth).toBe(before.masterScrollWidth);
      expect(after.masterScrollHeight).toBe(before.masterScrollHeight);
      expect(after.rowHeaderWidth).toBe(before.rowHeaderWidth);
    });
  });

  test.describe('regardless of the layout path', () => {
    for (const colWidths of ['uniform', 'varied'] as const) {
      test.describe(`with ${colWidths} column widths`, () => {
        test.beforeEach(async ({ page, theme, bundle }) => {
          wt = new InlineStartBorderRefreshPage(page, theme, bundle);
          await wt.goto({ colWidths });
        });

        test('keeps stamping the backward-compatibility classes on the master', async () => {
          // No stylesheet reads these any more, but they are public DOM surface that has been there
          // for years. Dropping the position REPORT must not drop the stamping with it.
          expect(await wt.masterBorderClasses())
            .toEqual({ innerBorderInlineStart: false, innerBorderLeft: false });

          await wt.scrollAwayFromOffsetZero();

          expect(await wt.masterBorderClasses())
            .toEqual({ innerBorderInlineStart: true, innerBorderLeft: true });

          await wt.scrollToOffsetZero();

          expect(await wt.masterBorderClasses())
            .toEqual({ innerBorderInlineStart: false, innerBorderLeft: false });
        });

        test('leaves every overlay correctly sized and aligned after a round trip', async () => {
          // The other half of the change: no overlay may stop refreshing. A clone left stale by the
          // missing reconciliation draw shows up as a size that does not come back, or as the
          // inline-start clone's rows sitting at a different offset than the master's.
          const before = await wt.overlayMetrics();

          await wt.scrollAwayFromOffsetZero();

          const scrolled = await wt.overlayMetrics();

          // The row header's width is scroll independent since #6673, and so is the scroll range it
          // feeds. Both used to change by scrolling.
          expect(scrolled.rowHeaderWidth).toBe(before.rowHeaderWidth);
          expect(scrolled.hiderWidth).toBe(before.hiderWidth);

          // The reconciliation branch that no longer runs also carried the master's
          // `adjustElementsSize()`, the only place the hider is sized on that path. A horizontal
          // crossing must leave the vertical extent alone - the row-axis compensation reads
          // `scrollTop`, which a horizontal scroll does not move - and the scroll range in both axes
          // has to survive, or the grid keeps a scrollbar it cannot ride to the end.
          expect(scrolled.hiderHeight).toBe(before.hiderHeight);
          expect(scrolled.masterScrollHeight).toBe(before.masterScrollHeight);
          expect(scrolled.masterScrollWidth).toBe(before.masterScrollWidth);

          expect(scrolled.inlineStartCloneWidth).toBe(before.inlineStartCloneWidth);
          expect(scrolled.topCloneWidth).toBe(before.topCloneWidth);
          expect(scrolled.cornerCloneWidth).toBe(before.cornerCloneWidth);
          expect(scrolled.inlineStartFirstRowTop).toBe(scrolled.masterFirstRowTop);

          await wt.scrollToOffsetZero();

          expect(await wt.overlayMetrics()).toEqual(before);
        });
      });
    }
  });
});
