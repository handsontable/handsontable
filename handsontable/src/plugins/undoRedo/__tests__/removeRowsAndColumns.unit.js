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
