import { registerPlugin, TrimRows, UndoRedo } from 'handsontable/plugins';
import { setUpUndoGrid, spreadsheet } from './helpers/grid';

registerPlugin(UndoRedo);
registerPlugin(TrimRows);

describe('UndoRedo – removing rows and columns', () => {
  const grid = setUpUndoGrid();

  // DEV-3052: the old removal undo called `Object.keys()` on every removed row.
  it('should undo the removal of a null source row without throwing', () => {
    const hot = grid.create({
      data: [{ a: 1, b: 2 }, null, { a: 5, b: 6 }],
      columns: [{ data: 'a' }, { data: 'b' }],
    });

    hot.alter('remove_row', 1, 1);

    expect(() => hot.getPlugin('undoRedo').undo()).not.toThrow();
    expect(hot.countSourceRows()).toBe(3);
    expect(hot.getSourceDataAtRow(0)).toEqual({ a: 1, b: 2 });
    expect(hot.getSourceDataAtRow(2)).toEqual({ a: 5, b: 6 });
  });

  // DEV-179
  it('should bring back every visible row, the columns and the trimmed row', () => {
    const hot = grid.create({ data: spreadsheet(4, 3), trimRows: [1] });
    const original = hot.getSourceData();
    const view = hot.getData();

    // What the context menu's "Remove rows" sends for a selection of every visible row.
    hot.alter('remove_row', [[0, hot.countRows()]]);
    hot.getPlugin('undoRedo').undo();

    expect(hot.countCols()).toBe(3);
    expect(hot.getData()).toEqual(view);
    expect(hot.getSourceData()).toEqual(original);
  });

  // With no rows the source has no first row to count the columns in, so the replay must count them
  // in the index mapper, or every column change reads as vetoed and the step never leaves its stack.
  it('should undo a column insert and a column removal made after every row was removed', () => {
    const hot = grid.create({ data: spreadsheet(3, 3), colHeaders: true });
    const original = hot.getSourceData();
    const undoRedo = hot.getPlugin('undoRedo');
    const columnCount = () => hot.columnIndexMapper.getNumberOfIndexes();

    hot.alter('remove_row', 0, 3);
    hot.alter('insert_col_start', 0, 1);
    hot.alter('remove_col', 0, 2);

    expect(hot.countRows()).toBe(0);
    expect(columnCount()).toBe(2);

    undoRedo.undo();

    expect(columnCount()).toBe(4);

    undoRedo.undo();

    expect(columnCount()).toBe(3);

    undoRedo.undo();

    expect(hot.getSourceData()).toEqual(original);
    expect(undoRedo.isUndoAvailable()).toBe(false);
  });

  // `alter('remove_col')` lowers `fixedColumnsEnd` for the removed end columns. The undo has to give the
  // count back, or the restored columns come back as scrolling ones.
  it('should restore `fixedColumnsEnd` when it undoes the removal of end columns, and drop it again on redo', () => {
    const hot = grid.create({ data: spreadsheet(3, 6), fixedColumnsEnd: 3 });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_col', 4, 2);

    expect(hot.countCols()).toBe(4);
    expect(hot.getSettings().fixedColumnsEnd).toBe(1);

    undoRedo.undo();

    expect(hot.countCols()).toBe(6);
    expect(hot.getSettings().fixedColumnsEnd).toBe(3);

    undoRedo.redo();

    expect(hot.countCols()).toBe(4);
    expect(hot.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should keep a `fixedColumnsEnd` count set outside any step when it undoes a removal of columns before the band', () => {
    const hot = grid.create({ data: spreadsheet(3, 6), fixedColumnsEnd: 2 });

    hot.alter('remove_col', 0, 1);
    hot.updateSettings({ fixedColumnsEnd: 3 });
    hot.getPlugin('undoRedo').undo();

    expect(hot.countCols()).toBe(6);
    expect(hot.getSettings().fixedColumnsEnd).toBe(3);
  });

  // The edit is recorded after the removal, so it addresses the rows as the removal left them: row 1
  // is `A3`. Replayed in the wrong order, the undo writes `A3` back onto the restored `A2` row.
  it('should record a `runOperation()` that removes a row and edits a cell as one step', () => {
    const hot = grid.create({ data: spreadsheet(4, 2) });
    const original = hot.getSourceData();
    const undoRedo = hot.getPlugin('undoRedo');

    hot.runOperation('my_op', () => {
      hot.alter('remove_row', 1);
      hot.setDataAtCell(1, 0, 'x');
    });

    expect(hot.getData()).toEqual([['A1', 'B1'], ['x', 'B3'], ['A4', 'B4']]);
    expect(undoRedo.doneActions.map(({ actionType }) => actionType)).toEqual(['my_op']);

    undoRedo.undo();

    expect(hot.getSourceData()).toEqual(original);
    expect(undoRedo.isUndoAvailable()).toBe(false);

    undoRedo.redo();

    expect(hot.getData()).toEqual([['A1', 'B1'], ['x', 'B3'], ['A4', 'B4']]);
    expect(undoRedo.isRedoAvailable()).toBe(false);
  });

  // DEV-880: one removal of several ranges is one action, as the context menu sends it.
  describe('of ranges that are not next to each other', () => {
    it('should record one step for the rows and bring them all back with one undo', () => {
      const hot = grid.create({ data: spreadsheet(6, 2) });
      const original = hot.getSourceData();
      const undoRedo = hot.getPlugin('undoRedo');

      hot.alter('remove_row', [[0, 1], [2, 1], [4, 1]]);

      expect(hot.countRows()).toBe(3);
      expect(undoRedo.doneActions.length).toBe(1);

      undoRedo.undo();

      expect(hot.getSourceData()).toEqual(original);
    });

    it('should record one step for the columns and bring them all back with one undo', () => {
      const hot = grid.create({ data: spreadsheet(3, 5) });
      const original = hot.getSourceData();
      const undoRedo = hot.getPlugin('undoRedo');

      hot.alter('remove_col', [[0, 1], [2, 1]]);

      expect(hot.countCols()).toBe(3);
      expect(undoRedo.doneActions.length).toBe(1);

      undoRedo.undo();

      expect(hot.getSourceData()).toEqual(original);
    });
  });

  // DEV-549: a removal that never happened must not be undone.
  describe('cancelled by a before hook', () => {
    it('should record no step when `beforeRemoveRow` returns false', () => {
      const hot = grid.create({ data: spreadsheet(4, 2), beforeRemoveRow: () => false });

      hot.alter('remove_row', 1, 1);

      expect(hot.countRows()).toBe(4);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('should record no step when `beforeRemoveCol` returns false', () => {
      const hot = grid.create({ data: spreadsheet(4, 3), beforeRemoveCol: () => false });

      hot.alter('remove_col', 1, 1);

      expect(hot.countCols()).toBe(3);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });
  });

  // The journal does not carry a cell's `valid` flag, so the cells an undo fills back into removed rows
  // are validated again. Without it, an invalid cell came back without its invalid marker.
  it('should mark a cell invalid again when an undo brings back its removed row, and validate an undone edit once', async() => {
    const validator = jest.fn((value, callback) => callback(value !== 'bad'));
    const hot = grid.create({
      data: spreadsheet(3, 2),
      columns: [{ validator }, {}],
    });
    const undoRedo = hot.getPlugin('undoRedo');
    const settle = () => new Promise(resolve => setTimeout(resolve, 0));

    hot.setDataAtCell(1, 0, 'bad');
    await settle();

    expect(hot.getCellMeta(1, 0).valid).toBe(false);

    hot.alter('remove_row', 1);
    undoRedo.undo();
    await settle();

    expect(hot.getDataAtCell(1, 0)).toBe('bad');
    expect(hot.getCellMeta(1, 0).valid).toBe(false);

    validator.mockClear();
    undoRedo.undo();
    await settle();

    expect(hot.getDataAtCell(1, 0)).toBe('A2');
    expect(validator).toHaveBeenCalledTimes(1);
  });
});
