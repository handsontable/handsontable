import { test, expect } from '../fixtures/test';
import { FixedColumnsEndLimitsPage } from '../fixtures/pages/FixedColumnsEndLimitsPage';

/**
 * Review follow-ups for `fixedColumnsEnd` and the options that change the number of columns:
 *
 * - `maxCols` caps the columns the grid draws, so the end band is the last columns of that capped set. The column
 *   move guard has to protect the same columns the end overlay draws.
 * - `minCols` must not append filler columns after the last column while the option is set. They would take over
 *   the frozen slot and push the column that held the data out of the band.
 *
 * Grid of the fixture: 20 rows, 72 px columns, 500 x 300 px viewport, row and column headers.
 */
test.describe('fixedColumnsEnd and maxCols', { tag: '@core' }, () => {
  let grid: FixedColumnsEndLimitsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedColumnsEndLimitsPage(page, theme, bundle);
  });

  test('draws the band from the capped columns', async () => {
    await grid.open({ cols: 15, maxCols: 10, fixedColumnsEnd: 2, manualColumnMove: true });

    expect(await grid.countCols()).toBe(10);
    expect(await grid.endOverlayFirstRow()).toEqual(['R1C9', 'R1C10']);
  });

  test('does not move a column of the drawn band out of it', async () => {
    await grid.open({ cols: 15, maxCols: 10, fixedColumnsEnd: 2, manualColumnMove: true });
    const before = await grid.firstRow();

    // Column index 8 is the first column of the band the end overlay draws.
    await grid.dragColumnHeader(8, 3);

    expect(await grid.firstRow()).toEqual(before);
  });

  test('does not move a scrolling column into the drawn band', async () => {
    await grid.open({ cols: 15, maxCols: 10, fixedColumnsEnd: 2, manualColumnMove: true });
    const before = await grid.firstRow();

    // Released over the first half of the last column: the drop is right before it, inside the band. (A drop
    // right before the first band column is the last scrollable position and is allowed.)
    await grid.dragColumnHeader(3, 9);

    expect(await grid.firstRow()).toEqual(before);
  });

  test('still moves a scrolling column among the scrolling columns', async () => {
    // The control of the blocked drags above: the same gesture does move a column when it is allowed.
    await grid.open({ cols: 15, maxCols: 10, fixedColumnsEnd: 2, manualColumnMove: true });

    await grid.dragColumnHeader(2, 4);

    expect((await grid.firstRow()).slice(0, 5)).toEqual(['R1C1', 'R1C2', 'R1C4', 'R1C3', 'R1C5']);
  });
});

test.describe('fixedColumnsEnd and minCols', { tag: '@core' }, () => {
  let grid: FixedColumnsEndLimitsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedColumnsEndLimitsPage(page, theme, bundle);
  });

  test('keeps the last column in the band when a removed column would drop the grid under minCols', async () => {
    await grid.open({ cols: 10, minCols: 10, fixedColumnsEnd: 1 });
    expect(await grid.endOverlayFirstRow()).toEqual(['R1C10']);

    await grid.removeColumns(0, 1);

    expect(await grid.countCols()).toBe(9);
    expect(await grid.endOverlayFirstRow()).toEqual(['R1C10']);
    expect(await grid.fixedColumnsEnd()).toBe(1);
  });

  test('fills the grid up to minCols after a removed column while no column is frozen at the end', async () => {
    // The control of the case above: without the option the grid is refilled, so the count is the difference.
    await grid.open({ cols: 10, minCols: 10 });

    await grid.removeColumns(0, 1);

    expect(await grid.countCols()).toBe(10);
  });
});
