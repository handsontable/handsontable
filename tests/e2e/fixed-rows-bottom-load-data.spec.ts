import { test, expect } from '../fixtures/test';
import { FixedRowsBottomLoadDataPage } from '../fixtures/pages/FixedRowsBottomLoadDataPage';

/**
 * The frozen bottom rows are drawn by a clone whose rendered band comes from the live `totalRows` and
 * `fixedRowsBottom` settings, while the element a cell resolves to comes from the last draw. `loadData()`
 * refreshes the selection before it renders, so a selection that lands on the new pinned row made
 * `afterSelectionEnd` ask the clone for a row its DOM did not hold yet, and `loadData()` threw
 * `TR was expected to be rendered but is not`, with the master still on the old rows. `hot.getCell()` is
 * documented to answer `null` for a cell that is not rendered.
 *
 * The "control" case passes without the fix: a grid with no frozen bottom rows never had the problem.
 */
test.describe('loadData() and row removal on a grid with fixedRowsBottom', () => {
  let grid: FixedRowsBottomLoadDataPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FixedRowsBottomLoadDataPage(page, theme, bundle);
  });

  test('loads the data when the selection is clamped onto the new pinned row', async() => {
    await grid.goto({ rows: 10, fixedRowsBottom: 1 });
    await grid.selectCell(9, 0);

    expect(await grid.loadDataExpectingError(3)).toBeNull();

    expect(await grid.countRows()).toBe(3);
    await expect(grid.masterRows).toHaveCount(3);
    await expect(grid.bottomCloneRows).toHaveCount(1);
    await expect(grid.bottomCloneRows.first().locator('td').first()).toHaveText('2-0');
    // The focus manager asked for this cell while the clone still held the old row, and it still lands on it.
    await expect(grid.bottomCloneRows.first().locator('td').first()).toBeFocused();
    expect(await grid.selected()).toEqual([[2, 0, 2, 0]]);
  });

  test('loads the data when the grid also has a frozen start column', async() => {
    await grid.goto({ rows: 10, fixedRowsBottom: 1, fixedColumnsStart: 1 });
    await grid.selectCell(9, 0);

    expect(await grid.loadDataExpectingError(3)).toBeNull();

    expect(await grid.countRows()).toBe(3);
    await expect(grid.masterRows).toHaveCount(3);
    await expect(grid.bottomCloneRows.first().locator('td').first()).toHaveText('2-0');
    expect(await grid.selected()).toEqual([[2, 0, 2, 0]]);
  });

  test('loads the data when the grid also has a frozen end column', async() => {
    await grid.goto({ rows: 10, fixedRowsBottom: 1, fixedColumnsEnd: 1 });
    await grid.selectCell(9, 4);

    expect(await grid.loadDataExpectingError(3)).toBeNull();

    expect(await grid.countRows()).toBe(3);
    await expect(grid.masterRows).toHaveCount(3);
    await expect(grid.bottomEndCornerCells()).toHaveText(['2-4']);
    expect(await grid.selected()).toEqual([[2, 4, 2, 4]]);
  });

  test('loads the data when the selection started above the pinned row', async() => {
    await grid.goto({ rows: 10, fixedRowsBottom: 1 });
    await grid.selectCell(5, 0);

    // Row 5 is past the end of the new data, so the selection is clamped to row 2, the new pinned row.
    expect(await grid.loadDataExpectingError(3)).toBeNull();

    expect(await grid.countRows()).toBe(3);
    await expect(grid.masterRows).toHaveCount(3);
    expect(await grid.selected()).toEqual([[2, 0, 2, 0]]);
  });

  test('loads the data when several rows are pinned', async() => {
    await grid.goto({ rows: 10, fixedRowsBottom: 2 });
    await grid.selectCell(9, 0);

    expect(await grid.loadDataExpectingError(4)).toBeNull();

    expect(await grid.countRows()).toBe(4);
    await expect(grid.masterRows).toHaveCount(4);
    await expect(grid.bottomCloneRows.locator('td:first-child')).toHaveText(['2-0', '3-0']);
    expect(await grid.selected()).toEqual([[3, 0, 3, 0]]);
  });

  test('answers null, not another row, for a pinned cell that the removal has not rendered yet', async() => {
    await grid.goto({ rows: 10, fixedRowsBottom: 2 });
    // The bottom clone holds rows 8 and 9. After removing row 0 the pinned rows are 7 and 8, which the clone
    // still draws as the old rows 8 and 9 until the render that closes `alter()`.
    await grid.probeTopmostCellsIn('afterRemoveRow', [7, 8]);

    expect(await grid.removeRowExpectingError(0)).toBeNull();

    expect(await grid.probedCells()).toEqual({ 7: null, 8: null });
    // Once the grid rendered, the same calls answer the rows now pinned.
    expect(await grid.topmostCellText(7)).toBe('8-0');
    expect(await grid.topmostCellText(8)).toBe('9-0');
  });

  test('answers null for a row past the drawn band when every row of the grid is pinned', async() => {
    // More pinned rows than rows: the first row of the band stays 0 whatever the row count does, so only the
    // count of rows tells that the clone is behind.
    await grid.goto({ rows: 3, fixedRowsBottom: 5 });
    await grid.selectCell(2, 0);
    await grid.probeTopmostCellsIn('afterSelectionEnd', [3]);

    expect(await grid.loadDataExpectingError(4)).toBeNull();

    expect(await grid.probedCells()).toEqual({ 3: null });
    expect(await grid.topmostCellText(3)).toBe('3-0');
  });

  test('answers null for a row past the drawn band when the rows and the pinned rows grow together', async() => {
    // 10 rows with 2 pinned and 12 rows with 4 pinned both start the band at row 8: only its end moved.
    await grid.goto({ rows: 10, fixedRowsBottom: 2 });
    await grid.selectCell(9, 0);
    await grid.probeTopmostCellsIn('afterSelectionEnd', [10]);

    expect(await grid.updateDataAndSettingsExpectingError(12, { fixedRowsBottom: 4 })).toBeNull();

    expect(await grid.probedCells()).toEqual({ 10: null });
    expect(await grid.topmostCellText(10)).toBe('10-0');
  });

  test('loads the data when the bottom rows are frozen in the same call that shrinks it', async() => {
    // The wrappers send `data` and the frozen count together. The bottom clone of a grid built without frozen
    // rows was never drawn, so it has no filter to compare with.
    await grid.goto({ rows: 10 });
    await grid.selectCell(9, 0);

    expect(await grid.updateDataAndSettingsExpectingError(3, { fixedRowsBottom: 1 })).toBeNull();

    expect(await grid.countRows()).toBe(3);
    await expect(grid.masterRows).toHaveCount(3);
    await expect(grid.bottomCloneRows.first().locator('td').first()).toHaveText('2-0');
    expect(await grid.selected()).toEqual([[2, 0, 2, 0]]);
  });

  test('answers null for a frozen top row of a clone that was never drawn', async() => {
    // No frozen top rows and no column headers: the top clone has not drawn anything yet.
    await grid.goto({ rows: 3 });
    await grid.selectCell(2, 0);
    await grid.probeTopmostCellsIn('afterSelectionEnd', [4]);

    expect(await grid.updateDataAndSettingsExpectingError(8, { fixedRowsTop: 5 })).toBeNull();

    expect(await grid.probedCells()).toEqual({ 4: null });
    expect(await grid.topmostCellText(4)).toBe('4-0');
  });

  test('answers null for a frozen top row the grid has not drawn yet when the data grew', async() => {
    // The top clone also reads its band from the live row count: 3 rows were drawn, 8 are loaded, and the
    // 5 frozen top rows then name rows 3 and 4, which the clone has no TR for until the render.
    await grid.goto({ rows: 3, fixedRowsTop: 5 });
    await grid.selectCell(2, 0);
    await grid.probeTopmostCellsIn('afterSelectionEnd', [4]);

    expect(await grid.loadDataExpectingError(8)).toBeNull();

    expect(await grid.probedCells()).toEqual({ 4: null });
    expect(await grid.topmostCellText(4)).toBe('4-0');
  });

  test('keeps resolving the pinned cells at rest when a hidden row sits in the frozen bottom band', async() => {
    // The band counts renderable rows and not hidden frozen ones, as the clone's TBODY does, so a clone that is up
    // to date is never mistaken for a stale one.
    await grid.goto({ rows: 10, fixedRowsBottom: 3, hiddenRows: '8' });

    await expect(grid.bottomCloneRows).toHaveCount(2);
    expect(await grid.topmostCellText(9)).toBe('9-0');
    expect(await grid.topmostCellText(7)).toBe('7-0');
    expect(await grid.topmostCellText(8)).toBeNull();
  });

  test('control: loads the data with no frozen bottom rows', async() => {
    await grid.goto({ rows: 10 });
    await grid.selectCell(9, 0);

    expect(await grid.loadDataExpectingError(3)).toBeNull();

    expect(await grid.countRows()).toBe(3);
    await expect(grid.masterRows).toHaveCount(3);
    expect(await grid.selected()).toEqual([[2, 0, 2, 0]]);
  });
});
