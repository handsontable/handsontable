import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarInFlightDragPage } from '../fixtures/pages/SheetsBarInFlightDragPage';

/**
 * A drag held while the grid's data is replaced, here by a sheet switch made through the API, used to
 * be committed on release into the sheet that arrived: a cell or row move, a column resize, a fill, and
 * a freeze drag. The gesture is now canceled with the data it was started on. Each test first checks that
 * its drag really started, so a gesture that never engaged cannot pass for a canceled one.
 */
test.describe('SheetsBar switch during a drag', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarInFlightDragPage;
  const betaColumn = ['b3', 'b1', 'b2'];

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarInFlightDragPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('cancels a cell move', async() => {
    await grid.startCellMove(2, 1);

    expect(await grid.isDragInProgress('cellMove')).toBe(true);
    expect(await grid.setActiveSheet('Beta')).toBe(true);
    expect(await grid.isDragInProgress('cellMove')).toBe(false);

    await grid.release();

    expect(await grid.declaredSheetColumn(1, 0)).toEqual(betaColumn);
    expect(await grid.declaredSheetColumn(1, 1)).toEqual(['b-x', 'b-y', 'b-z']);
    expect(await grid.declaredSheetColumn(0, 0)).toEqual(['a3', 'a1', 'a2']);
  });

  test('cancels a row move', async() => {
    await grid.startRowMove(0, 2);

    expect(await grid.isDragInProgress('rowMove')).toBe(true);
    expect(await grid.setActiveSheet('Beta')).toBe(true);
    expect(await grid.isDragInProgress('rowMove')).toBe(false);

    await grid.release();

    expect(await grid.visualColumn(0)).toEqual(betaColumn);
    expect(await grid.setActiveSheet('Alpha')).toBe(true);
    expect(await grid.visualColumn(0)).toEqual(['a3', 'a1', 'a2']);
  });

  test('cancels a column resize', async() => {
    await grid.startColumnResize(0);

    expect(await grid.isDragInProgress('columnResize')).toBe(true);
    expect(await grid.setActiveSheet('Beta')).toBe(true);
    expect(await grid.isDragInProgress('columnResize')).toBe(false);

    const widthBefore = await grid.columnWidth(0);

    await grid.release();

    expect(await grid.columnWidth(0)).toBe(widthBefore);
  });

  test('cancels a fill', async() => {
    expect(await grid.setActiveSheet('Beta')).toBe(true);
    await grid.selectCell(0, 0);
    expect(await grid.setActiveSheet('Alpha')).toBe(true);

    await grid.startFill(2, 0);

    expect(await grid.isDragInProgress('fill')).toBe(true);
    expect(await grid.setActiveSheet('Beta')).toBe(true);
    expect(await grid.isDragInProgress('fill')).toBe(false);

    await grid.continueDrag(1, 0, 2, 0);
    await grid.release();

    expect(await grid.declaredSheetColumn(1, 0)).toEqual(betaColumn);
    expect(await grid.declaredSheetColumn(0, 0)).toEqual(['a3', 'a1', 'a2']);
  });

  test('keeps a column resize held while the grid only updates its data', async() => {
    await grid.startColumnResize(0);

    expect(await grid.isDragInProgress('columnResize')).toBe(true);

    await grid.updateDataInPlace();

    expect(await grid.isDragInProgress('columnResize')).toBe(true);

    await grid.release();

    expect(await grid.columnWidth(0)).toBeGreaterThan(60);
  });

  test('cancels a freeze drag', async() => {
    await grid.startFreezeDrag(2);

    expect(await grid.isDragInProgress('freeze')).toBe(true);
    expect(await grid.setActiveSheet('Beta')).toBe(true);
    expect(await grid.isDragInProgress('freeze')).toBe(false);

    await grid.release();

    expect(await grid.frozenTopRows()).toBe(0);
    expect(await grid.setActiveSheet('Alpha')).toBe(true);
    expect(await grid.frozenTopRows()).toBe(0);
  });
});
