import { test, expect } from '../../fixtures/test';
import { RtlWindowPage } from '../../fixtures/pages/RtlWindowPage';

/**
 * RTL overlay behavior when the WINDOW is the scrollable element — migrated
 * from the two legacy Walkontable specs "…after table scroll (window object
 * as scrollable element)" (rtl/overlay.spec.js), skipped since the 2022 RTL
 * introduction because the Jasmine env cannot really window-scroll. Rewritten
 * behaviorally at the grid level: after scrolling to the document end, every
 * frozen overlay clone must pin to its viewport edge, and overlay content
 * must stay column-aligned with the master (DEV-2183).
 */
test.describe('walkontable RTL overlays with window scroll', { tag: '@walkontable' }, () => {
  const EDGE_TOLERANCE = 2;
  let wt: RtlWindowPage;

  test.beforeEach(async ({ page, theme }) => {
    wt = new RtlWindowPage(page, theme);
    await wt.goto();
  });

  test('frozen overlays pin to the viewport edges after scrolling to the document end', async () => {
    const viewport = await wt.viewport();

    await wt.scrollWindowToEnd();

    // Top overlay (frozen rows) sticks to the viewport top.
    const top = await wt.box(wt.topOverlay);

    expect(Math.abs(top.y)).toBeLessThanOrEqual(EDGE_TOLERANCE);

    // Bottom overlay (fixedRowsBottom) sticks to the viewport bottom.
    const bottom = await wt.box(wt.bottomOverlay);

    expect(Math.abs(bottom.y + bottom.height - viewport.height)).toBeLessThanOrEqual(EDGE_TOLERANCE);

    // Inline-start overlay: in RTL the start edge is the RIGHT edge of the viewport.
    const inlineStart = await wt.box(wt.inlineStartOverlay);

    expect(Math.abs(inlineStart.x + inlineStart.width - viewport.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);

    // Both corners pin to their two edges at once.
    const topCorner = await wt.box(wt.topCorner);

    expect(Math.abs(topCorner.y)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(Math.abs(topCorner.x + topCorner.width - viewport.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);

    const bottomCorner = await wt.box(wt.bottomCorner);

    expect(Math.abs(bottomCorner.y + bottomCorner.height - viewport.height)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(Math.abs(bottomCorner.x + bottomCorner.width - viewport.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
  });

  test('header overlay content stays column-aligned with the master after window scroll', async () => {
    await wt.scrollWindowToEnd();

    // The top clone renders the frozen first rows of the SAME columns the
    // master shows at the current scroll position — cell R1C30 lives only in
    // the clone, R80C30 only in the master. Their x-positions must match, or
    // the clone has drifted horizontally from the grid under it.
    const cloneCell = await wt.box(wt.topOverlay.getByTestId('cell-0-29'));
    const masterCell = await wt.box(wt.master.getByTestId('cell-79-29'));

    expect(Math.abs(cloneCell.x - masterCell.x)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(Math.abs(cloneCell.width - masterCell.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
  });
});
