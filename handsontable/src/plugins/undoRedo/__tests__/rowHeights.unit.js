import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { setUpUndoGrid, spreadsheet } from './grid';

registerPlugin(UndoRedo);

/**
 * `alter()` replaces an array `rowHeights` and `minRowHeights` with a copy aligned to the physical rows
 * (DEV-508). A step holds the arrays by reference in its settings snapshot, so an undo puts back the
 * array the step started from, the height of a removed row included.
 */
describe('UndoRedo with an array rowHeights', () => {
  const { create } = setUpUndoGrid();

  it('should bring back the height of a removed row on undo, and drop it again on redo', () => {
    const hot = create({ data: spreadsheet(3, 1), rowHeights: [100, 50, 40], autoRowSize: false });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('remove_row', 0);

    expect(hot.getSettings().rowHeights).toEqual([50, 40]);

    undoRedo.undo();

    expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);
    expect(hot.getSettings().rowHeights).toEqual([100, 50, 40]);
    expect([0, 1, 2].map(row => hot.getRowHeight(row))).toEqual([100, 50, 40]);

    undoRedo.redo();

    expect(hot.getSettings().rowHeights).toEqual([50, 40]);
    expect(hot.getRowHeight(0)).toBe(50);
  });

  it('should take an inserted row\'s slot out on undo', () => {
    const hot = create({ data: spreadsheet(3, 1), minRowHeights: [80, 60, 70], autoRowSize: false });

    hot.alter('insert_row_above', 1);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getSettings().minRowHeights).toEqual([80, 60, 70]);
  });

  it('should keep heights set after a step that did not change them', () => {
    const hot = create({ data: spreadsheet(3, 1), rowHeights: [100, 50, 40], autoRowSize: false });

    hot.setDataAtCell(0, 0, 'edited');
    hot.updateSettings({ rowHeights: [30, 30, 30] });
    hot.getPlugin('undoRedo').undo();

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
    expect(hot.getSettings().rowHeights).toEqual([30, 30, 30]);
  });
});
