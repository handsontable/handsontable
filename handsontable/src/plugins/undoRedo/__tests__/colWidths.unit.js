import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { setUpUndoGrid, spreadsheet } from './grid';

registerPlugin(UndoRedo);

/**
 * An array `colWidths` is read through a core column index map that holds the entry each column was declared
 * at. UndoRedo snapshots that map with the other index maps, so undo and redo put every width back on its
 * column, a removed column's width included, while the array the user passed is never changed.
 */
describe('UndoRedo with an array colWidths', () => {
  const { create } = setUpUndoGrid();

  /**
   * Reads the width of every column.
   *
   * @param {Handsontable} hot The grid.
   * @returns {Array}
   */
  function widths(hot) {
    return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
  }

  it('should bring back the width of a removed column on undo, and drop it again on redo', () => {
    const colWidths = [100, 150, 200];
    const hot = create({ data: spreadsheet(1, 3), colWidths, autoColumnSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_col', 0);

    expect(widths(hot)).toEqual([150, 200]);

    undoRedo.undo();

    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1']);
    expect(widths(hot)).toEqual([100, 150, 200]);

    undoRedo.redo();

    expect(widths(hot)).toEqual([150, 200]);
    expect(hot.getSettings().colWidths).toBe(colWidths);
    expect(colWidths).toEqual([100, 150, 200]);
  });

  it('should take an inserted column back out on undo', () => {
    const hot = create({ data: spreadsheet(1, 3), colWidths: [80, 60, 70], autoColumnSize: false });

    hot.alter('insert_col_start', 1);
    hot.getPlugin('undoRedo').undo();

    expect(widths(hot)).toEqual([80, 60, 70]);
  });

  it('should drop the history when a new array replaces the previous one, rather than undo into its columns', () => {
    const hot = create({ data: spreadsheet(1, 3), colWidths: [100, 150, 200], autoColumnSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('insert_col_start', 0);
    hot.updateSettings({ colWidths: [10, 20, 30, 40] });

    expect(undoRedo.isUndoAvailable()).toBe(false);

    undoRedo.undo();

    expect(widths(hot)).toEqual([10, 20, 30, 40]);
  });

  it('should keep the history when the same array is passed again', () => {
    const colWidths = [100, 150, 200];
    const hot = create({ data: spreadsheet(1, 3), colWidths, autoColumnSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_col', 0);
    hot.updateSettings({ colWidths });
    undoRedo.undo();

    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1']);
    expect(widths(hot)).toEqual([100, 150, 200]);
  });

  it('should drop the history when `colWidths` becomes an array, rather than undo into other widths', () => {
    const hot = create({ data: spreadsheet(1, 3), colWidths: 30, autoColumnSize: false });

    hot.alter('remove_col', 0);
    hot.updateSettings({ colWidths: [50, 60] });

    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    expect(widths(hot)).toEqual([50, 60]);
  });
});
