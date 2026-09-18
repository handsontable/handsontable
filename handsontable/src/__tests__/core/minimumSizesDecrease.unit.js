import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable';

/**
 * Lowering `minRows`, `minSpareRows`, `minCols` or `minSpareCols` through `updateSettings()` gives back the empty
 * rows and columns the previous value added, and nothing else (DEV-2206).
 */
describe('Core#updateSettings lowering the minimum sizes', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Creates a grid on the test container.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  describe('rows', () => {
    it('should remove the rows a lowered `minRows` no longer requires', () => {
      const data = [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']];

      createGrid({ data, minRows: 6 });

      expect(hot.countRows()).toBe(6);

      hot.updateSettings({ minRows: 1 });

      expect(hot.countRows()).toBe(3);
      expect(hot.countSourceRows()).toBe(3);
      expect(data.length).toBe(3);
      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']]);
    });

    it('should remove the rows a lowered `minSpareRows` no longer requires', () => {
      createGrid({ data: [['A1']], minSpareRows: 5 });

      expect(hot.countRows()).toBe(6);

      hot.updateSettings({ minSpareRows: 3 });

      expect(hot.countRows()).toBe(4);
      expect(hot.countEmptyRows(true)).toBe(3);
    });

    it('should keep a spare row the user wrote into, and the empty rows above it', () => {
      createGrid({ data: [['A1']], minSpareRows: 3 });

      hot.setDataAtCell(2, 0, 'A3');

      expect(hot.countRows()).toBe(6);

      hot.updateSettings({ minSpareRows: 1 });

      expect(hot.countRows()).toBe(4);
      expect(hot.getDataAtCol(0)).toEqual(['A1', null, 'A3', null]);
    });

    it('should keep the empty rows that came with the data set', () => {
      // One trailing empty row already satisfies `minSpareRows: 1`, so the option adds nothing and lowering it
      // must take nothing either - the grid has to end up as it would have been built with the lower value.
      const data = [['A1'], [null], [null]];

      createGrid({ data, minSpareRows: 1 });

      expect(hot.countRows()).toBe(3);

      hot.updateSettings({ minSpareRows: 0 });

      expect(hot.countRows()).toBe(3);
      expect(data.length).toBe(3);
    });

    it('should keep the data set\'s own empty rows and remove only the ones the option added', () => {
      const data = [['A1'], [null]];

      createGrid({ data, minSpareRows: 3 });

      expect(hot.countRows()).toBe(4);

      hot.updateSettings({ minSpareRows: 0 });

      expect(hot.countRows()).toBe(2);
      expect(data.length).toBe(2);
    });

    it('should keep an empty row the user inserted below the added ones', () => {
      createGrid({ data: [['A1']], minRows: 3 });

      hot.alter('insert_row_below', 2);

      expect(hot.countRows()).toBe(4);

      hot.updateSettings({ minRows: 0 });

      // The last row was inserted by the user, so the walk from the end stops there at once.
      expect(hot.countRows()).toBe(4);
    });

    it('should remove the added rows after a sort moved them', () => {
      createGrid({
        data: [['b'], ['a']],
        minSpareRows: 3,
        columnSorting: true,
      });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      hot.updateSettings({ minSpareRows: 1 });

      expect(hot.countRows()).toBe(3);
      expect(hot.getDataAtCol(0)).toEqual(['a', 'b', null]);
    });

    it('should remove the rows with one `afterRemoveRow` call with the `auto` source, and create none', () => {
      const afterRemoveRow = jasmine.createSpy('afterRemoveRow');
      const afterCreateRow = jasmine.createSpy('afterCreateRow');

      createGrid({ data: [['A1']], minSpareRows: 5 });

      hot.addHook('afterRemoveRow', afterRemoveRow);
      hot.addHook('afterCreateRow', afterCreateRow);
      hot.updateSettings({ minSpareRows: 3 });

      expect(afterRemoveRow).toHaveBeenCalledTimes(1);
      expect(afterRemoveRow).toHaveBeenCalledWith(4, 2, [4, 5], 'auto');
      expect(afterCreateRow).not.toHaveBeenCalled();
    });

    it('should not remove anything when the value is raised or passed unchanged', () => {
      const afterRemoveRow = jasmine.createSpy('afterRemoveRow');

      createGrid({ data: [['A1']], minRows: 3, minSpareRows: 1 });

      hot.addHook('afterRemoveRow', afterRemoveRow);
      hot.updateSettings({ minRows: 3, minSpareRows: 1 });
      hot.updateSettings({ minRows: 5 });

      expect(afterRemoveRow).not.toHaveBeenCalled();
      expect(hot.countRows()).toBe(5);
    });

    it('should not remove rows when a `beforeRemoveRow` listener cancels the removal', () => {
      createGrid({ data: [['A1']], minRows: 5 });

      hot.addHook('beforeRemoveRow', () => false);
      hot.updateSettings({ minRows: 2 });

      expect(hot.countRows()).toBe(5);
    });

    it('should keep an open edit when a `beforeRemoveRow` listener cancels the removal', () => {
      createGrid({ data: [['A1']], minRows: 5 });

      hot.addHook('beforeRemoveRow', () => false);
      hot.selectCell(4, 0);

      const editor = hot.getActiveEditor();

      editor.beginEditing();
      editor.setValue('typed');

      hot.updateSettings({ minRows: 2 });

      // The row is still there, so the text typed into it must be too.
      expect(hot.countRows()).toBe(5);
      expect(hot.getActiveEditor().isOpened()).toBe(true);
      expect(hot.getActiveEditor().getValue()).toBe('typed');
    });

    it('should not remove rows from a data set passed in the same call', () => {
      createGrid({ data: [['A1']], minRows: 5 });

      const data = [['A1'], [null], [null]];

      hot.updateSettings({ data, minRows: 0 });

      expect(hot.countRows()).toBe(3);
      expect(data.length).toBe(3);
    });

    it('should keep the cell meta of the rows it does not remove', () => {
      createGrid({ data: [['A1']], minRows: 5 });

      hot.setCellMeta(0, 0, 'marker', 'first row');

      hot.updateSettings({ minRows: 2 });

      expect(hot.getCellMeta(0, 0).marker).toBe('first row');
      expect(hot.getCellMeta(1, 0).marker).toBeUndefined();
    });

    it('should keep the cell meta with its row when a sort put another row after the removed ones', () => {
      createGrid({
        data: [['b'], ['a']],
        minRows: 5,
        columnSorting: true,
      });

      // Physical row 4, so the two rows the removal takes (physical 2 and 3) sit above it.
      hot.setDataAtCell(4, 0, 'c');
      hot.setCellMeta(4, 0, 'marker', 'c-row');

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c', null, null]);

      hot.updateSettings({ minRows: 2 });

      expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);
      // The marker has to follow its row, whatever physical index the removal left it on.
      expect(hot.getCellMeta(2, 0).marker).toBe('c-row');
    });

    it('should leave the data alone while `maxRows` hides part of the grid', () => {
      createGrid({ data: [['A1']], minRows: 5 });

      expect(hot.countSourceRows()).toBe(5);

      // The removal cannot address a row the cap hides, so acting on the capped count would take a row out of
      // the middle of the data set. The rows stay until the cap is lifted.
      hot.updateSettings({ maxRows: 3, minRows: 2 });

      expect(hot.countSourceRows()).toBe(5);
      expect(hot.getSourceData()).toEqual([['A1'], [null], [null], [null], [null]]);
    });

    it('should not remove rows that a write past the last row created', () => {
      createGrid({ data: [['A1']], minRows: 10 });

      // Writing past the last row grows the grid through the same internal source as `minRows` does.
      hot.setDataAtCell(14, 0, 'typed');

      expect(hot.countRows()).toBe(15);

      hot.setDataAtCell(14, 0, null);
      hot.updateSettings({ minRows: 2 });

      // Only the ten rows `minRows` itself created may go, and the walk stops at the first row it did not.
      expect(hot.countRows()).toBe(15);
    });

    it('should give the rows back down to the new value, even after a blocked lowering', () => {
      createGrid({ data: [['A1']], minRows: 10 });

      const blockRemoval = () => false;

      // A listener blocks the first lowering, so the grid keeps ten rows while `minRows` reads 5.
      hot.addHook('beforeRemoveRow', blockRemoval);
      hot.updateSettings({ minRows: 5 });

      expect(hot.countRows()).toBe(10);

      hot.removeHook('beforeRemoveRow', blockRemoval);
      hot.updateSettings({ minRows: 2 });

      // Down to the new value, not down by the size of this one step.
      expect(hot.countRows()).toBe(2);
    });

    it('should not add an undo action', () => {
      createGrid({ data: [['A1']], minRows: 5, undo: true });

      hot.updateSettings({ minRows: 2 });

      expect(hot.countRows()).toBe(2);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('should move a selection that sat on a removed row onto the last row', () => {
      createGrid({ data: [['A1', 'B1']], minRows: 5 });

      hot.selectCell(4, 1);
      hot.updateSettings({ minRows: 2 });

      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    });

    it('should clamp a range that reached into the removed rows, and keep its start', () => {
      createGrid({ data: [['A1', 'B1']], minRows: 5 });

      hot.selectCell(1, 0, 4, 1);
      hot.updateSettings({ minRows: 3 });

      expect(hot.getSelectedLast()).toEqual([1, 0, 2, 1]);
    });

    it('should not scroll the window when it moves the selection', () => {
      createGrid({ data: [['A1', 'B1']], minRows: 5 });

      hot.selectCell(4, 1);

      // jsdom has no `window.scrollTo`, and with no `height` set the window owns the grid's vertical scroll.
      const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      hot.updateSettings({ minRows: 2 });

      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
      expect(scrollTo).not.toHaveBeenCalled();

      scrollTo.mockRestore();
    });

    it('should not touch a selection above the removed rows', () => {
      const afterSelection = jasmine.createSpy('afterSelection');

      createGrid({ data: [['A1', 'B1']], minRows: 5 });

      hot.selectCell(0, 1);
      hot.addHook('afterSelection', afterSelection);
      hot.updateSettings({ minRows: 2 });

      expect(hot.getSelectedLast()).toEqual([0, 1, 0, 1]);
      expect(afterSelection).not.toHaveBeenCalled();
    });

    it('should close an editor opened on a removed row without saving it', () => {
      createGrid({ data: [['A1']], minRows: 5 });

      hot.selectCell(4, 0);

      const editor = hot.getActiveEditor();

      editor.beginEditing();
      editor.setValue('typed');

      hot.updateSettings({ minRows: 2 });

      expect(hot.getActiveEditor().isOpened()).toBe(false);
      expect(hot.countRows()).toBe(2);
      expect(hot.getSourceData()).toEqual([['A1'], [null]]);
    });

    it('should remove the rows with the Formulas plugin enabled', () => {
      createGrid({
        data: [['=1+1']],
        minSpareRows: 5,
        formulas: { engine: HyperFormula },
      });

      hot.updateSettings({ minSpareRows: 2 });

      expect(hot.countRows()).toBe(3);
      expect(hot.getDataAtCell(0, 0)).toBe(2);
    });

    it('should keep a border on a row it does not remove, in step with that row\'s cell meta', () => {
      createGrid({ data: [['A1'], ['A2']], minSpareRows: 3, customBorders: true });

      const customBorders = hot.getPlugin('customBorders');

      // Row 1 holds data, so the removal stops above it and its border has to survive untouched.
      customBorders.setBorders([[1, 0, 1, 0]], { top: { width: 2, color: 'red' } });

      hot.updateSettings({ minSpareRows: 0 });

      expect(hot.countRows()).toBe(2);
      expect(hot.getCellMeta(1, 0).borders).toBeDefined();
      expect(customBorders.getBorders([[1, 0, 1, 0]]).length).toBe(1);
    });
  });

  describe('columns', () => {
    it('should remove the columns a lowered `minCols` no longer requires', () => {
      const data = [['A1'], ['A2']];

      createGrid({ data, minCols: 4 });

      expect(hot.countCols()).toBe(4);

      hot.updateSettings({ minCols: 2 });

      expect(hot.countCols()).toBe(2);
      expect(hot.countSourceCols()).toBe(2);
      expect(data).toEqual([['A1', null], ['A2', null]]);
    });

    it('should remove the columns a lowered `minSpareCols` no longer requires', () => {
      createGrid({ data: [['A1']], minSpareCols: 5 });

      expect(hot.countCols()).toBe(6);

      hot.updateSettings({ minSpareCols: 2 });

      expect(hot.countCols()).toBe(3);
      expect(hot.countEmptyCols(true)).toBe(2);
    });

    it('should keep the empty columns that came with the data set', () => {
      const data = [['A1', null, null]];

      createGrid({ data, minSpareCols: 1 });

      expect(hot.countCols()).toBe(3);

      hot.updateSettings({ minSpareCols: 0 });

      expect(hot.countCols()).toBe(3);
      expect(data[0].length).toBe(3);
    });

    it('should keep the added columns once the user inserted a column after them', () => {
      createGrid({ data: [['A1']], minSpareCols: 2 });

      hot.alter('insert_col_end', 2);

      expect(hot.countCols()).toBe(4);

      hot.updateSettings({ minSpareCols: 0 });

      expect(hot.countCols()).toBe(4);
    });

    it('should keep the data set\'s own empty column after the user removed an added one', () => {
      // One added column: the data set's own empty column leaves one spare column to add for `minSpareCols: 2`.
      createGrid({ data: [['A1', null]], minSpareCols: 2 });

      expect(hot.countCols()).toBe(3);

      // Removing the added column makes the grid add a fresh one to keep two spare columns.
      hot.alter('remove_col', 2);

      expect(hot.countCols()).toBe(3);

      hot.updateSettings({ minSpareCols: 0 });

      expect(hot.countCols()).toBe(2);
    });

    it('should still remove the added columns after the user inserted a column before them', () => {
      createGrid({ data: [['A1']], minSpareCols: 3 });

      hot.alter('insert_col_start', 0);

      expect(hot.countCols()).toBe(5);

      hot.updateSettings({ minSpareCols: 1 });

      expect(hot.countCols()).toBe(3);
    });

    it('should not remove columns when the `columns` option is set', () => {
      createGrid({
        data: [['A1', null, null]],
        columns: [{}, {}, {}],
        minSpareCols: 2,
      });

      expect(() => hot.updateSettings({ minSpareCols: 0 })).not.toThrow();
      expect(hot.countCols()).toBe(3);
    });

    it('should move a selection that sat on a removed column onto the last column', () => {
      createGrid({ data: [['A1'], ['A2']], minCols: 5 });

      hot.selectCell(1, 4);
      hot.updateSettings({ minCols: 2 });

      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    });
  });
});
