import { test, expect, THEMES_TAG } from '../fixtures/test';
import { ManualColumnMoveDataReplacePage } from '../fixtures/pages/ManualColumnMoveDataReplacePage';

/**
 * A column header drag held while the column order starts over used to be committed on release against
 * the new order, and the header press it started with sorted a column of the new data. The drag and the
 * queued sort are now canceled. Each test first checks that its drag started and that the guideline moved
 * into the frozen overlay, so a gesture that never engaged cannot pass for a canceled one.
 */
test.describe('ManualColumnMove drag while the column order starts over', { tag: THEMES_TAG }, () => {
  let grid: ManualColumnMoveDataReplacePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualColumnMoveDataReplacePage(page, theme, bundle);
    await grid.goto();
    await grid.startColumnMove(1);

    expect(await grid.isDragging()).toBe(true);
    expect(await grid.guidelineTable()).toBe('frozen');
  });

  test('moves the column on release when nothing replaces the data', async() => {
    await grid.release();

    expect(await grid.columnOrder()).toEqual([1, 0, 2]);
    expect(await grid.column(0)).toEqual(['b3', 'b1', 'b2']);
  });

  test('cancels the drag and the sort when loadData() replaces the data', async() => {
    await grid.loadOtherData();

    expect(await grid.isDragging()).toBe(false);
    expect(await grid.guidelineTable()).toBe('master');

    await grid.release();

    expect(await grid.columnOrder()).toEqual([0, 1, 2]);
    expect(await grid.column(1)).toEqual(['y3', 'y1', 'y2']);
  });

  test('cancels the drag and the sort when the columns option is set', async() => {
    await grid.setColumns();

    expect(await grid.isDragging()).toBe(false);

    await grid.release();

    expect(await grid.columnOrder()).toEqual([0, 1, 2]);
    expect(await grid.column(1)).toEqual(['b3', 'b1', 'b2']);
  });

  test('keeps the drag when updateData() sends data of the same shape', async() => {
    await grid.updateOtherData();

    expect(await grid.isDragging()).toBe(true);

    await grid.release();

    expect(await grid.columnOrder()).toEqual([1, 0, 2]);
    expect(await grid.column(0)).toEqual(['y3', 'y1', 'y2']);
  });

  test('keeps the drag when the plugin settings are sent again', async() => {
    await grid.setManualColumnMove(true);

    expect(await grid.isDragging()).toBe(true);

    await grid.release();

    expect(await grid.columnOrder()).toEqual([1, 0, 2]);
  });

  test('forgets the drag when the plugin is turned off, so a later release moves nothing', async() => {
    await grid.setManualColumnMove(false);
    await grid.release();
    await grid.setManualColumnMove(true);
    await grid.clickAwayFromGrid();

    expect(await grid.columnOrder()).toEqual([0, 1, 2]);
  });
});
