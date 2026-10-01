import { test, expect } from '../fixtures/test';
import {
  type AlignmentReport,
  COMPARISONS,
  OverlayAlignmentCssZoomPage,
} from '../fixtures/pages/OverlayAlignmentCssZoomPage';

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
 * the cell it has to coincide with — all four edges for the top-anchored overlays (column headers,
 * row headers, the top corner); for the two bottom-anchored ones (pinned to the window's bottom edge
 * while the table is taller than the window), columns and row heights against the master and all
 * four edges against each other, the bottom-freeze seam row included — at 125% and at the 100%
 * control, on two grids: the demo's shape with a frozen column, and one with row headers alone,
 * because a table row is as tall as its tallest cell and only a row-header overlay whose rows hold a
 * `th` by itself renders the #11465 split.
 *
 * The bottom band's vertical position against the master rows it repeats is compared at 100%, with
 * the grid's end in view so the band sits over those rows: exact there on every theme. It is not
 * compared under zoom, because the engine places the band from whole-pixel sizes and the result
 * carries a rounding residue that varies with the zoom level and never accumulates — measured on
 * `main`, `horizon` and `classic` from 80% to 150%: 0 at 100% and 150% on all three, up to 0.3px at
 * 80%, 0.02 to 0.41px at 90% and 110%, and 0.5px at 125% on all three. A tolerance that admitted it
 * would also admit the one-snapped-border drift this spec exists for.
 *
 * The zoom is applied before the grids are built (the first render measures zoomed cells) and, in
 * a second case, after it, which is what the retired screenshot did. Measured on all three themes:
 * a grid does not redraw when the page zoom changes, and the grid measures through
 * `offsetWidth`/`offsetHeight`, which zoom does not scale, so both cases lay the same written sizes
 * out under the same zoom. The second case pins that premise with a positive control: it first
 * proves the draw counter sees an asynchronous redraw after the same three-frame settle (a window
 * `resize`, the one asynchronous path that redraws these window-scrolled grids), and only then
 * reads it unchanged across the zoom change.
 *
 * Every alignment test asserts its own preconditions first — the leg really runs its theme, and the
 * zoom really reached the grid: a cell's viewport box is the zoom times its layout box, and its 1px
 * border is computed as 0.8px at 125% (1.25 device pixels snapped down to one, measured on every
 * theme at device scale 1) and as 1px at 100%. Without them an alignment test would pass on a page
 * that never zoomed, whatever else ran.
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
// The computed width of a cell's declared 1px border at each zoom this spec renders (see above).
const SNAPPED_BORDER_PX: Record<number, number> = { 1: 1, [ZOOM]: 0.8 };
// Edges within this differ by a LayoutUnit residue, not a snapped border: see the docblock.
const ZOOMED_EDGE_TOLERANCE_PX = 0.2;
const CONTROL_EDGE_TOLERANCE_PX = 0.1;
// How many clone cells each grid's comparisons hold. Pinned exactly: the fixture owns its rows and
// columns, no theme changes a cell count, and a comparison that read fewer cells compared the wrong
// thing — an empty misalignment list would then prove nothing.
const COMPARED_CELLS: Record<string, number> = {
  [OverlayAlignmentCssZoomPage.FROZEN_COLUMN]: 149,
  [OverlayAlignmentCssZoomPage.ROW_HEADERS_ONLY]: 106,
};
// The same for the bottom band against the master rows it repeats: two rows of the bottom overlay
// (row header plus eight columns) and of the bottom-start corner (the row header, plus the frozen
// column where there is one).
const BOTTOM_BAND_CELLS: Record<string, number> = {
  [OverlayAlignmentCssZoomPage.FROZEN_COLUMN]: 22,
  [OverlayAlignmentCssZoomPage.ROW_HEADERS_ONLY]: 20,
};

let page: OverlayAlignmentCssZoomPage;

/**
 * Asserts the test's own preconditions: the leg runs the theme it claims, and the zoom reached the
 * grid (its cells are scaled by it, and their border snapped as that zoom snaps it).
 *
 * @param {string} gridId The grid to check.
 * @param {number} zoom The zoom the grid should be rendered at.
 * @param {string} theme The leg's theme.
 */
async function expectRenderedAt(gridId: string, zoom: number, theme: string): Promise<void> {
  // The fixture links the theme stylesheet, but the rules only apply through each container's
  // `ht-theme-*` class — miss it and all six legs render the default theme while reporting as three.
  expect(await page.activeTheme(gridId), `${gridId} theme`).toBe(`ht-theme-${theme}`);

  const applied = await page.appliedZoom(gridId);

  expect(applied.zoom, `${gridId} effective zoom`).toBeCloseTo(zoom, 2);
  expect(applied.border, `${gridId} computed cell border`).toBeCloseTo(SNAPPED_BORDER_PX[zoom], 2);
}

/**
 * Asserts a report describes a comparison that ran over every comparison it names and found nothing
 * past the tolerance it was given.
 *
 * @param {AlignmentReport} report The report.
 * @param {number} expectedCells How many cells the comparison must have read.
 * @param {readonly string[]} comparisons The comparisons that must each have read at least one cell.
 * @param {number} tolerance The tolerance the report was built with, for the message.
 */
function expectAligned(
  report: AlignmentReport, expectedCells: number, comparisons: readonly string[], tolerance: number
): void {
  expect(report.unmatchedRows, 'every clone row maps to a counterpart row').toEqual([]);
  expect(report.compared, 'cells compared').toBe(expectedCells);

  for (const comparison of comparisons) {
    expect(report.comparedByOverlay[comparison], `${comparison}: cells compared`).toBeGreaterThan(0);
  }

  expect(report.misalignments, `edges past ${tolerance}px (largest ${report.maxDifference}px)`)
    .toEqual([]);
}

test.describe('overlay alignment under CSS zoom', () => {
  test.beforeEach(async({ page: browserPage, theme, bundle }) => {
    page = new OverlayAlignmentCssZoomPage(browserPage, theme, bundle);
  });

  for (const gridId of OverlayAlignmentCssZoomPage.ALL_GRIDS) {
    test(`${gridId}: overlay cells coincide with the cells they cover at 125%, zoomed before the grid is built`, async({ theme }) => {
      await page.goto(ZOOM);
      await expectRenderedAt(gridId, ZOOM, theme);

      expectAligned(await page.alignment(gridId, ZOOMED_EDGE_TOLERANCE_PX), COMPARED_CELLS[gridId], COMPARISONS,
        ZOOMED_EDGE_TOLERANCE_PX);
    });

    test(`${gridId}: overlay cells coincide with the cells they cover at 125%, zoomed after the grid is built`, async({ theme }) => {
      // The retired screenshot's shape: the grid measured its rows at 100%, then the page zoomed.
      await page.goto(1);
      await expectRenderedAt(gridId, 1, theme);

      // Positive control for the draw counter and the settle: a window `resize` redraws the grid
      // asynchronously, and the counter has seen it once the settle is over.
      const drawsBeforeResize = await page.renderCount(gridId);

      await page.nudgeViewportWidth();
      await page.afterFrames();
      expect(await page.renderCount(gridId), 'draws after a window resize').toBeGreaterThan(drawsBeforeResize);

      // The premise the docblock states: no draw follows a zoom change, so the layout read next is
      // the browser's, from the sizes written at 100%. A grid that starts redrawing on a zoom change
      // fails here, after the same settle the control just proved long enough, instead of having
      // `alignment()` read across the draw.
      const drawsBeforeZoom = await page.renderCount(gridId);

      await page.applyZoom(ZOOM);
      await page.afterFrames();
      await expectRenderedAt(gridId, ZOOM, theme);
      expect(await page.renderCount(gridId), 'draws since the zoom was applied').toBe(drawsBeforeZoom);

      expectAligned(await page.alignment(gridId, ZOOMED_EDGE_TOLERANCE_PX), COMPARED_CELLS[gridId], COMPARISONS,
        ZOOMED_EDGE_TOLERANCE_PX);
    });

    test(`${gridId}: overlay cells coincide with the cells they cover at 100%, and the bottom band sits on its master rows — the control`, async({ theme }) => {
      // The configuration every user runs. The comparison has to hold here for the zoomed cases to
      // mean anything: a mapping that misaligned at 100% would be reporting itself, not the zoom.
      await page.goto(1);
      await expectRenderedAt(gridId, 1, theme);

      expectAligned(await page.alignment(gridId, CONTROL_EDGE_TOLERANCE_PX), COMPARED_CELLS[gridId], COMPARISONS,
        CONTROL_EDGE_TOLERANCE_PX);

      // With the grid's end in view the bottom band sits over the rows it repeats, so its vertical
      // position against the master can be compared directly — exact at 100% on every theme.
      await page.scrollGridEndIntoView(gridId);

      expectAligned(await page.bottomBandPlacement(gridId, CONTROL_EDGE_TOLERANCE_PX), BOTTOM_BAND_CELLS[gridId],
        ['bottom', 'bottom-start-corner'], CONTROL_EDGE_TOLERANCE_PX);
    });
  }
});
