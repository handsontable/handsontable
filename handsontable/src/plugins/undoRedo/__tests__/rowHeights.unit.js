import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { setUpUndoGrid, spreadsheet } from './grid';

registerPlugin(UndoRedo);

/**
 * An array `rowHeights` or `minRowHeights` is read through a core row index map that holds the entry each row
 * was declared at (DEV-508). UndoRedo snapshots that map with the other index maps, so undo and redo put every
 * height back on its row, a removed row's height included, while the array the user passed is never changed.
 */
describe('UndoRedo with an array rowHeights', () => {
  const { create } = setUpUndoGrid();

  /**
   * Reads the height of every row.
   *
   * @param {Handsontable} hot The grid.
   * @returns {Array}
   */
  function heights(hot) {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getRowHeight(row));
  }

  it('should bring back the height of a removed row on undo, and drop it again on redo', () => {
    const rowHeights = [100, 50, 40];
    const hot = create({ data: spreadsheet(3, 1), rowHeights, autoRowSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 0);

    expect(heights(hot)).toEqual([50, 40]);

    undoRedo.undo();

    expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);
    expect(heights(hot)).toEqual([100, 50, 40]);

    undoRedo.redo();

    expect(heights(hot)).toEqual([50, 40]);
    expect(hot.getSettings().rowHeights).toBe(rowHeights);
    expect(rowHeights).toEqual([100, 50, 40]);
  });

  it('should take an inserted row back out on undo', () => {
    const hot = create({ data: spreadsheet(3, 1), minRowHeights: [80, 60, 70], autoRowSize: false });

    hot.alter('insert_row_above', 1);
    hot.getPlugin('undoRedo').undo();

    expect(heights(hot)).toEqual([80, 60, 70]);
  });

  it('should drop the history when a new array replaces the previous one, rather than undo into its rows', () => {
    const hot = create({ data: spreadsheet(3, 1), rowHeights: [10, 20, 30], autoRowSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('insert_row_above', 1);
    hot.updateSettings({ rowHeights: [70, 80, 90, 95] });

    expect(undoRedo.isUndoAvailable()).toBe(false);

    undoRedo.undo();

    expect(heights(hot)).toEqual([70, 80, 90, 95]);
  });

  it('should drop the history for a new array after a row removal too', () => {
    const hot = create({ data: spreadsheet(3, 1), rowHeights: [10, 20, 30], autoRowSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 0);
    hot.updateSettings({ rowHeights: [50, 60] });
    undoRedo.undo();

    expect(hot.getDataAtCol(0)).toEqual(['A2', 'A3']);
    expect(heights(hot)).toEqual([50, 60]);
  });

  it('should keep the history when the same array is passed again', () => {
    const rowHeights = [100, 50, 40];
    const hot = create({ data: spreadsheet(3, 1), rowHeights, autoRowSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 0);
    hot.updateSettings({ rowHeights });
    undoRedo.undo();

    expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);
    expect(heights(hot)).toEqual([100, 50, 40]);
  });

  it('should drop the history when `rowHeights` becomes an array, rather than undo into other heights', () => {
    const hot = create({ data: spreadsheet(3, 1), rowHeights: 30, autoRowSize: false });

    hot.alter('remove_row', 0);
    hot.updateSettings({ rowHeights: [50, 60] });

    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    expect(heights(hot)).toEqual([50, 60]);
  });
});
