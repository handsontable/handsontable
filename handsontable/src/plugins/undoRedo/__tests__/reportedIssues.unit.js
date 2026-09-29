import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable/base';
import {
  AutoColumnSize, Comments, DropdownMenu, Filters, Formulas, HiddenColumns, HiddenRows, ManualColumnFreeze,
  registerPlugin, TrimRows, UndoRedo,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(AutoColumnSize);
registerPlugin(UndoRedo);
registerPlugin(TrimRows);
registerPlugin(HiddenRows);
registerPlugin(DropdownMenu);
registerPlugin(ManualColumnFreeze);
registerPlugin(HiddenColumns);
registerPlugin(Filters);
registerPlugin(Comments);
registerPlugin(Formulas);

/**
 * One case per undo bug reported in ClickUp and fixed by the UndoRedo rebuild (DEV-3142), so each of
 * them stays fixed. Every case fails on the 18.x implementation. The cases that need a real browser -
 * ColumnSummary (it calculates on the first visible render), autofill of merged cells, row resizing and
 * the double-click autosize - live in the Playwright specs `undo-reported-issues.spec.ts` and
 * `undo-plugin-state.spec.ts`.
 */
describe('UndoRedo – reported issues', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  /**
   * Builds a grid of `A1`-style values.
   *
   * @param {number} rows The number of rows.
   * @param {number} columns The number of columns.
   * @returns {Array}
   */
  function sheet(rows, columns) {
    return Array.from({ length: rows }, (_, row) => Array.from(
      { length: columns }, (__, column) => `${String.fromCharCode(65 + column)}${row + 1}`,
    ));
  }

  /**
   * Creates the grid with the undo plugin on.
   *
   * @param {object} settings The settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      undo: true,
      ...settings,
    });

    return hot;
  }

  /**
   * Undoes until the undo stack is empty.
   */
  function undoAll() {
    const undoRedo = hot.getPlugin('undoRedo');

    while (undoRedo.isUndoAvailable()) {
      undoRedo.undo();
    }
  }

  describe('DEV-3134: an edit followed by a column freeze', () => {
    it('should put the edited cell back and leave every other cell alone', () => {
      createGrid({ data: sheet(6, 8), manualColumnFreeze: true });

      const original = hot.getSourceData();

      hot.setDataAtCell(4, 3, 43000);
      hot.getPlugin('manualColumnFreeze').freezeColumn(4);
      undoAll();

      expect(hot.getSourceData()).toEqual(original);
      expect(hot.toPhysicalColumn(0)).toBe(0);
    });
  });

  describe('DEV-3052: removing a null row', () => {
    it('should undo the removal without throwing', () => {
      createGrid({
        data: [{ a: 1, b: 2 }, null, { a: 5, b: 6 }],
        columns: [{ data: 'a' }, { data: 'b' }],
      });

      hot.alter('remove_row', 1, 1);

      expect(() => hot.getPlugin('undoRedo').undo()).not.toThrow();
      expect(hot.countSourceRows()).toBe(3);
      expect(hot.getSourceDataAtRow(0)).toEqual({ a: 1, b: 2 });
      expect(hot.getSourceDataAtRow(2)).toEqual({ a: 5, b: 6 });
    });
  });

  describe('DEV-179: removing every visible row while a row is trimmed', () => {
    it('should bring back the rows, the columns and the trimmed row', () => {
      createGrid({ data: sheet(4, 3), trimRows: [1] });

      const original = hot.getSourceData();
      const view = hot.getData();

      // What the context menu's "Remove rows" sends for a selection of every visible row.
      hot.alter('remove_row', [[0, hot.countRows()]]);
      hot.getPlugin('undoRedo').undo();

      expect(hot.countCols()).toBe(3);
      expect(hot.getData()).toEqual(view);
      expect(hot.getSourceData()).toEqual(original);
    });
  });

  describe('DEV-880: removing rows or columns that are not next to each other', () => {
    it('should record one step for the rows and bring them all back with one undo', () => {
      createGrid({ data: sheet(6, 2) });

      const original = hot.getSourceData();
      const undoRedo = hot.getPlugin('undoRedo');

      hot.alter('remove_row', [[0, 1], [2, 1], [4, 1]]);

      expect(hot.countRows()).toBe(3);
      expect(undoRedo.doneActions.length).toBe(1);

      undoRedo.undo();

      expect(hot.getSourceData()).toEqual(original);
    });

    it('should record one step for the columns and bring them all back with one undo', () => {
      createGrid({ data: sheet(3, 5) });

      const original = hot.getSourceData();
      const undoRedo = hot.getPlugin('undoRedo');

      hot.alter('remove_col', [[0, 1], [2, 1]]);

      expect(hot.countCols()).toBe(3);
      expect(undoRedo.doneActions.length).toBe(1);

      undoRedo.undo();

      expect(hot.getSourceData()).toEqual(original);
    });
  });

  describe('DEV-549: a removal cancelled by a before hook', () => {
    it('should record no step when `beforeRemoveRow` returns false', () => {
      createGrid({ data: sheet(4, 2), beforeRemoveRow: () => false });

      hot.alter('remove_row', 1, 1);

      expect(hot.countRows()).toBe(4);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('should record no step when `beforeRemoveCol` returns false', () => {
      createGrid({ data: sheet(4, 3), beforeRemoveCol: () => false });

      hot.alter('remove_col', 1, 1);

      expect(hot.countCols()).toBe(3);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });
  });

  describe('DEV-767: removing the only row a filter leaves visible', () => {
    it('should bring the row back, still visible', () => {
      createGrid({ data: sheet(5, 3), filters: true });

      const original = hot.getSourceData();
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'by_value', [['A1']]);
      filters.filter();
      hot.alter('remove_row', 0, 1);

      expect(hot.countRows()).toBe(0);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getData()).toEqual([['A1', 'B1', 'C1']]);
      expect(hot.getSourceData()).toEqual(original);
    });
  });

  describe('DEV-985: a row removed while filtered, then the filter cleared', () => {
    it('should restore the data exactly', () => {
      createGrid({
        data: [['1', 'et'], ['2', 'dolor'], ['3', 'et'], ['4', 'sit'], ['5', 'amet'], ['6', 'et']],
        filters: true,
      });

      const original = hot.getSourceData();
      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'by_value', [['et']]);
      filters.filter();
      hot.alter('remove_row', 1, 1);
      filters.clearConditions();
      filters.filter();
      undoAll();

      expect(hot.getSourceData()).toEqual(original);
      expect(hot.getData()).toEqual(original);
    });
  });

  describe('DEV-515: comments', () => {
    it('should undo and redo adding, editing, locking and removing a comment', () => {
      createGrid({ data: sheet(3, 3), comments: true });

      const comments = hot.getPlugin('comments');
      const undoRedo = hot.getPlugin('undoRedo');
      const comment = () => hot.getCellMeta(0, 0).comment ?? null;

      comments.setCommentAtCell(0, 0, 'First');
      comments.setCommentAtCell(0, 0, 'Second');
      comments.updateCommentMeta(0, 0, { readOnly: true });
      comments.removeCommentAtCell(0, 0);

      expect(comment()).toBeNull();

      undoRedo.undo();

      expect(comment()).toEqual({ value: 'Second', readOnly: true });

      undoRedo.undo();

      expect(comment()).toEqual({ value: 'Second' });

      undoRedo.undo();

      expect(comment()).toEqual({ value: 'First' });

      undoRedo.undo();

      expect(comment()).toBeNull();

      undoRedo.redo();
      undoRedo.redo();
      undoRedo.redo();

      expect(comment()).toEqual({ value: 'Second', readOnly: true });
    });
  });

  describe('DEV-137: cell meta written with `setCellMeta()`', () => {
    it('should undo and redo a `className` and a `readOnly` change', () => {
      createGrid({ data: sheet(3, 3) });

      const undoRedo = hot.getPlugin('undoRedo');

      hot.setCellMeta(1, 1, 'className', 'blue');
      hot.setCellMeta(2, 2, 'readOnly', true);

      undoRedo.undo();

      expect(hot.getCellMeta(2, 2).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).className).toBe('blue');

      undoRedo.undo();

      expect(hot.getCellMeta(1, 1).className).toBeUndefined();

      undoRedo.redo();
      undoRedo.redo();

      expect(hot.getCellMeta(1, 1).className).toBe('blue');
      expect(hot.getCellMeta(2, 2).readOnly).toBe(true);
    });
  });

  describe('DEV-2806: the operations the task listed as not undoable', () => {
    it('should undo hiding columns', () => {
      createGrid({ data: sheet(3, 5), hiddenColumns: true });

      const hiddenColumns = hot.getPlugin('hiddenColumns');

      hiddenColumns.hideColumns([1, 3]);

      expect(hiddenColumns.getHiddenColumns()).toEqual([1, 3]);

      hot.getPlugin('undoRedo').undo();

      expect(hiddenColumns.getHiddenColumns()).toEqual([]);
    });
  });

  describe('DEV-688: Formulas and a paste that adds columns', () => {
    it('should show the calculated values again after the undo', () => {
      createGrid({
        data: [[1, 2, '=A1*B1'], [3, 4, '=A2*B2'], [5, 6, '=A3*B3']],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      });

      const before = hot.getData();

      expect(before).toEqual([[1, 2, 2], [3, 4, 12], [5, 6, 30]]);

      hot.populateFromArray(0, 1, [['x', 'y', 'z'], ['x', 'y', 'z']], undefined, undefined, 'CopyPaste.paste');

      expect(hot.countCols()).toBe(4);

      hot.getPlugin('undoRedo').undo();

      expect(hot.countCols()).toBe(3);
      expect(hot.getData()).toEqual(before);
    });
  });
});
