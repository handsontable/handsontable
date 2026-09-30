import { test, expect } from '../fixtures/test';
import { OverlayAlignmentCssZoomPage } from '../fixtures/pages/OverlayAlignmentCssZoomPage';

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
 * the master cell painted under it — all four edges, every overlay the complex demo's layout has
 * (nested column headers, row headers, a frozen column, rows frozen at the top and at the bottom,
 * both corners) — at 125% and at the 100% control, on two grids: the demo's shape with a frozen
 * column, and one with row headers alone, because a table row is as tall as its tallest cell and
 * only a row-header overlay whose rows hold a `th` by itself renders the #11465 split.
 *
 * The zoom is applied before the grids are built (the first render measures zoomed cells) and, in
 * a second case, after it, which is what the retired screenshot did. Measured on all three themes:
 * a grid does not redraw when the page zoom changes (`afterViewRender` count unchanged), so the
 * second case is the browser re-laying out the sizes the grid wrote at 100%, and both cases have to
 * hold.
 *
 * Two preconditions guard the rest: the leg really runs its theme, and the zoom really applies to
 * the grid — a cell's viewport box is 1.25 times its layout box, and its 1px border is computed as
 * 0.8px (1.25 device pixels snapped down to one, measured on every theme), which is the snapping
 * that pulls tables apart. Without them every alignment assertion passes on an unzoomed page.
 *
 * The tolerance is half a CSS pixel of the zoomed viewport: two tables laid out to the same pixels
 * coincide exactly, so a correct render differs by 0, and one layout pixel of drift is 1.25 here.
 */

const ZOOM = 1.25;
const EDGE_TOLERANCE_PX = 0.5;
// The overlays of the smaller grid hold this many cells with a master counterpart; a comparison
// that ran over fewer compared the wrong thing, and an empty misalignment list would prove nothing.
const MIN_COMPARED_CELLS = 80;

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
      expect(await page.cellBorderBottomWidth(gridId), `${gridId} snapped border`).toBeCloseTo(0.8, 5);
    }
  });

  for (const gridId of OverlayAlignmentCssZoomPage.ALL_GRIDS) {
    test(`${gridId}: every overlay cell coincides with its master cell at 125%, zoomed before the grid is built`, async() => {
      await page.goto(ZOOM);

      const report = await page.alignment(gridId, EDGE_TOLERANCE_PX);

      expect(report.unmatchedRows, 'every clone row maps to a master row').toEqual([]);
      expect(report.compared, 'cells compared').toBeGreaterThanOrEqual(MIN_COMPARED_CELLS);
      expect(report.misalignments, `edges past ${EDGE_TOLERANCE_PX}px (largest ${report.maxDifference}px)`)
        .toEqual([]);
    });

    test(`${gridId}: every overlay cell coincides with its master cell at 125%, zoomed after the grid is built`, async() => {
      // The retired screenshot's shape: the grid measured its rows at 100%, then the page zoomed.
      await page.goto(1);
      expect(await page.effectiveZoom(gridId)).toBe(1);

      await page.applyZoom(ZOOM);
      await expect.poll(() => page.effectiveZoom(gridId), { message: 'the zoom applied to the grid' })
        .toBeCloseTo(ZOOM, 2);

      const report = await page.alignment(gridId, EDGE_TOLERANCE_PX);

      expect(report.unmatchedRows, 'every clone row maps to a master row').toEqual([]);
      expect(report.compared, 'cells compared').toBeGreaterThanOrEqual(MIN_COMPARED_CELLS);
      expect(report.misalignments, `edges past ${EDGE_TOLERANCE_PX}px (largest ${report.maxDifference}px)`)
        .toEqual([]);
    });

    test(`${gridId}: every overlay cell coincides with its master cell at 100% — the control`, async() => {
      // The configuration every user runs. The comparison has to hold here for the zoomed cases to
      // mean anything: a mapping that misaligned at 100% would be reporting itself, not the zoom.
      await page.goto(1);

      const report = await page.alignment(gridId, EDGE_TOLERANCE_PX);

      expect(report.unmatchedRows).toEqual([]);
      expect(report.compared).toBeGreaterThanOrEqual(MIN_COMPARED_CELLS);
      expect(report.misalignments).toEqual([]);
      // Measured: 0 on `main` and `classic`, and a 1/32 px rounding residue (0.03125) on `horizon`,
      // whose metrics are fractional. Anything near a pixel here is the comparison misreporting.
      expect(report.maxDifference).toBeLessThan(0.1);
    });
  }
});
