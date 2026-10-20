import { test, expect } from '../fixtures/test';
import { RowSizeAlignmentPage } from '../fixtures/pages/RowSizeAlignmentPage';

/**
 * The row header stays level with its row after the grid is scrolled with the wheel, on the visual
 * suite's retired `/row-size-demo` grid (`autoRowSize`, 320 px high), with one-line rows and with rows whose
 * labels wrap onto two lines. #11872 fixed the misalignment these were the only check of; the two row
 * size captures under `visual-tests/tests/js-only/row-size/` photographed it and nothing asserted it.
 * Every row inside the holder's visible area is compared, top and bottom, on every theme and bundle.
 */

const EDGE_TOLERANCE_PX = 0.5;

for (const [cells, deltaY] of [['normal', 300], ['small', 500]] as const) {
  test(`keeps every row header level with its row after a wheel scroll (${cells} cells)`, async({
    page, theme, bundle,
  }) => {
    const grid = new RowSizeAlignmentPage(page, theme, bundle);

    await grid.goto(cells);

    const atRest = await grid.visibleRowPairs();
    const restHeight = atRest[0].masterBottom - atRest[0].masterTop;

    await grid.wheelDown(deltaY);

    const pairs = await grid.visibleRowPairs();

    expect(pairs.length).toBeGreaterThan(3);
    pairs.forEach((pair) => {
      expect(Math.abs(pair.masterTop - pair.headerTop), `row ${pair.row} top`).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(Math.abs(pair.masterBottom - pair.headerBottom), `row ${pair.row} bottom`)
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    });
    // The rows that scrolled in keep the height the first rows had.
    pairs.slice(1, -1).forEach((pair) => {
      expect(Math.abs((pair.masterBottom - pair.masterTop) - restHeight), `row ${pair.row} height`)
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    });

    if (cells === 'small') {
      // The precondition that makes this case different: the 40 px columns wrap every label onto a
      // second line, so the rows are taller than a one-line row.
      await grid.goto('normal');

      const oneLine = (await grid.visibleRowPairs())[0];

      expect(restHeight).toBeGreaterThan((oneLine.masterBottom - oneLine.masterTop) + 10);
    }
  });
}
