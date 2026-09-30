import { test, expect } from '../fixtures/test';
import { OverlayAlignmentCssZoomPage, OVERLAYS } from '../fixtures/pages/OverlayAlignmentCssZoomPage';

/**
 * The overlays line up with the master under page zoom.
 *
 * A grid paints several tables over each other: the master holds every cell, and the column
 * headers, the row headers, the frozen rows and the corners are separate tables positioned over
 * the master's cells. They line up only while each table lays its rows and columns out to the same
 * pixels, and page zoom is where that can break: the browser snaps borders and row heights to
 * device pixels per table, so a height rule that differs between a header cell and a data cell
 * shows as row headers drifting from their rows once the page is zoomed. #11465 was that shape
 * (the first body row's `th` was declared a pixel shorter than its `td`) and shipped with a
 * screenshot of the complex demo at 125% as its only check
 * (`visual-tests/tests/js-only/complex-demo/render-in-css-zoom`). A screenshot shows the drift once
 * it is large enough to see; it cannot say the edges coincide, and a drift approved once becomes the
 * golden.
 *
 * So this spec compares, from DOM rects and on every theme and bundle leg, every overlay cell with
 * the master cell painted under it — all four edges for the top-anchored overlays (column headers,
 * row headers, the top corner), columns and row heights for the two bottom-anchored ones (pinned to
 * the window's bottom edge while the table is taller than the window, so their vertical position
 * is by design not the master's; the page object says why their first row is compared on columns
 * alone) — at 125% and at the 100% control, on two grids: the demo's shape with a frozen column,
 * and one with row headers alone, because a table row is as tall as its tallest cell and only a
 * row-header overlay whose rows hold a `th` by itself renders the #11465 split.
 *
 * The zoom is applied before the grids are built (the first render measures zoomed cells) and, in
 * a second case, after it, which is what the retired screenshot did. Measured on all three themes:
 * a grid does not redraw when the page zoom changes (`afterViewRender` count unchanged), and the
 * grid measures through `offsetWidth`/`offsetHeight`, which zoom does not scale, so both cases lay
 * the same written sizes out under the same zoom. The second case therefore pins its premise: if
 * the grid ever starts redrawing on a zoom change, the render count moves and the case says so,
 * instead of straddling a draw it never waited for.
 *
 * Two preconditions guard the rest: the leg really runs its theme, and the zoom really applies to
 * the grid — a cell's viewport box is 1.25 times its layout box, and its 1px border is computed as
 * 0.8px (1.25 device pixels snapped down to one, measured on every theme at device scale 1), which
 * is the snapping that pulls tables apart. Without them every alignment assertion passes on an
 * unzoomed page.
 *
 * Tolerances are set from the snapping, not from whole pixels. The #11465 shape moves one
 * first-row cell by ONE snapped border, which at 125% is 0.25 to 0.5 CSS pixels of the zoomed
 * viewport — so a half-pixel tolerance would let it through, and the 100% control would catch
 * nothing either (at 100% there is nothing to snap). A correct render at 125% differs by a
 * LayoutUnit residue only: 0.078125px (5/64) on `main`, 0.0625 on `classic`, 0.046875 on `horizon`.
 * The zoomed tolerance is 0.2px, 2.5 times the largest residue and under the smallest snapped
 * drift; the control's is 0.1px (0 on `main` and `classic`, a 1/32px residue on `horizon`). A whole
 * layout pixel of drift is 1.25px here and fails either way.
 */

const ZOOM = 1.25;
// Edges within this differ by a LayoutUnit residue, not a snapped border: see the docblock.
const ZOOMED_EDGE_TOLERANCE_PX = 0.2;
const CONTROL_EDGE_TOLERANCE_PX = 0.1;
// How many clone cells each grid's five overlays hold with a master counterpart. Pinned exactly:
// the fixture owns its rows and columns, no theme changes a cell count, and a comparison that read
// fewer cells compared the wrong thing — an empty misalignment list would then prove nothing.
const COMPARED_CELLS: Record<string, number> = {
  [OverlayAlignmentCssZoomPage.FROZEN_COLUMN]: 145,
  [OverlayAlignmentCssZoomPage.ROW_HEADERS_ONLY]: 104,
};

/**
 * Asserts a report describes a comparison that ran over every overlay and found nothing past the
 * tolerance it was given.
 *
 * @param {string} gridId The grid the report is of.
 * @param {Awaited<ReturnType<OverlayAlignmentCssZoomPage['alignment']>>} report The report.
 * @param {number} tolerance The tolerance the report was built with, for the message.
 */
function expectAligned(
  gridId: string,
  report: Awaited<ReturnType<OverlayAlignmentCssZoomPage['alignment']>>,
  tolerance: number
): void {
  expect(report.unmatchedRows, 'every clone row maps to a master row').toEqual([]);
  expect(report.compared, 'cells compared').toBe(COMPARED_CELLS[gridId]);

  for (const overlay of OVERLAYS) {
    expect(report.comparedByOverlay[overlay], `${overlay} overlay cells compared`).toBeGreaterThan(0);
  }

  expect(report.misalignments, `edges past ${tolerance}px (largest ${report.maxDifference}px)`)
    .toEqual([]);
}

test.describe('overlay alignment under CSS zoom', () => {
  let page: OverlayAlignmentCssZoomPage;

  test.beforeEach(async({ page: browserPage, theme, bundle }) => {
    page = new OverlayAlignmentCssZoomPage(browserPage, theme, bundle);
  });

  test('the leg really runs the theme it claims', async({ theme }) => {
    // Guards the matrix itself. The fixture links the theme stylesheet, but the rules only apply
    // through each container's `ht-theme-*` class — miss it and all six legs render the default
    // theme while reporting as three.
    await page.goto(ZOOM);

    for (const gridId of OverlayAlignmentCssZoomPage.ALL_GRIDS) {
      expect(await page.activeTheme(gridId), gridId).toBe(`ht-theme-${theme}`);
    }
  });

  test('the zoom really applies to the grids', async() => {
    // Guards every alignment assertion: no zoom means no snapping to catch, and the rest of this
    // file would pass on a page that never zoomed.
    await page.goto(ZOOM);

    for (const gridId of OverlayAlignmentCssZoomPage.ALL_GRIDS) {
      expect(await page.effectiveZoom(gridId), `${gridId} effective zoom`).toBeCloseTo(ZOOM, 2);
      expect(await page.cellBorderBottomWidth(gridId), `${gridId} snapped border`).toBeCloseTo(0.8, 2);
    }
  });

  for (const gridId of OverlayAlignmentCssZoomPage.ALL_GRIDS) {
    test(`${gridId}: overlay cells coincide with their master cells at 125%, zoomed before the grid is built`, async() => {
      await page.goto(ZOOM);

      expectAligned(gridId, await page.alignment(gridId, ZOOMED_EDGE_TOLERANCE_PX), ZOOMED_EDGE_TOLERANCE_PX);
    });

    test(`${gridId}: overlay cells coincide with their master cells at 125%, zoomed after the grid is built`, async() => {
      // The retired screenshot's shape: the grid measured its rows at 100%, then the page zoomed.
      await page.goto(1);
      expect(await page.effectiveZoom(gridId)).toBe(1);

      const drawsBeforeZoom = await page.renderCount(gridId);

      await page.applyZoom(ZOOM);
      await expect.poll(() => page.effectiveZoom(gridId), { message: 'the zoom applied to the grid' })
        .toBeCloseTo(ZOOM, 2);

      // The premise the docblock states: the grid does not redraw on a zoom change, so the layout
      // read next is the browser's, from the sizes written at 100%, and nothing here waits on a
      // draw. A grid that starts redrawing fails here, not by straddling the draw below.
      expect(await page.renderCount(gridId), 'draws since the zoom was applied').toBe(drawsBeforeZoom);

      expectAligned(gridId, await page.alignment(gridId, ZOOMED_EDGE_TOLERANCE_PX), ZOOMED_EDGE_TOLERANCE_PX);
    });

    test(`${gridId}: overlay cells coincide with their master cells at 100% — the control`, async() => {
      // The configuration every user runs. The comparison has to hold here for the zoomed cases to
      // mean anything: a mapping that misaligned at 100% would be reporting itself, not the zoom.
      await page.goto(1);

      expectAligned(gridId, await page.alignment(gridId, CONTROL_EDGE_TOLERANCE_PX), CONTROL_EDGE_TOLERANCE_PX);
    });
  }
});
