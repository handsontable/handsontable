import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { registerPlugin } from '../../registry';
import { MoveCells } from '../../moveCells';

const LICENSE_KEY = 'non-commercial-and-evaluation';

registerPlugin(MoveCells);

describe('Formulas: an undo of a remove after an insert in a reordered grid', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const undo = () => hot.getPlugin('undoRedo').undo();
  const redo = () => hot.getPlugin('undoRedo').redo();

  const build = (settings) => {
    hot = new Handsontable(container, {
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      undoRedo: true,
      licenseKey: LICENSE_KEY,
      ...settings,
    });
  };

  const restoreRows = () => {
    hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_row_above', 1);
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    hot.alter('remove_row', 4);
  };

  const restoreColumns = () => {
    hot.columnIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_col_start', 1);
    hot.columnIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    hot.alter('remove_col', 4);
  };

  const rowData = [[null, null], [10, 20], [20, 40], [null, null]];
  const rowDataRestored = [...rowData, [null, null]];

  it('should restore the values of the formulas in the rows', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    restoreRows();

    expect(hot.getData()).toEqual(rowData);

    undo();

    expect(hot.getData()).toEqual(rowDataRestored);
  });

  it('should restore the values of the formulas in the columns', () => {
    build({ data: [[10, 20, null, null], ['=A1*2', '=B1*2', null, null]] });
    restoreColumns();

    expect(hot.getData()).toEqual([[null, 10, 20, null], [null, 20, 40, null]]);

    undo();

    expect(hot.getData()).toEqual([[null, 10, 20, null, null], [null, 20, 40, null, null]]);
  });

  it('should keep the values through a redo and a second undo', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    restoreRows();
    undo();
    redo();

    expect(hot.getData()).toEqual(rowData);

    undo();

    expect(hot.getData()).toEqual(rowDataRestored);
  });

  it('should keep the values through a redo and a second undo on columns', () => {
    build({ data: [[10, 20, null, null], ['=A1*2', '=B1*2', null, null]] });
    restoreColumns();
    undo();
    redo();

    expect(hot.getData()).toEqual([[null, 10, 20, null], [null, 20, 40, null]]);

    undo();

    expect(hot.getData()).toEqual([[null, 10, 20, null, null], [null, 20, 40, null, null]]);
  });

  it('should keep the values when the insert itself is undone after the order returned', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('insert_row_above', 1);
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
    undo();

    expect(hot.getData()).toEqual([[null, null], [10, 20], [20, 40], [null, null]]);
  });

  it('should keep the values a second sheet on the same engine reads', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const otherContainer = document.createElement('div');
    let other;

    document.body.appendChild(otherContainer);

    try {
      build({
        data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
      });

      other = new Handsontable(otherContainer, {
        data: [['=Sheet1!B2', '=Sheet1!B3']],
        formulas: { engine, sheetName: 'Sheet2' },
        licenseKey: LICENSE_KEY,
      });

      hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
      hot.alter('insert_row_above', 1);
      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);

      const beforeRemove = other.getDataAtRow(0);

      hot.alter('remove_row', 4);

      const afterRemove = other.getDataAtRow(0);

      undo();

      expect(hot.getData()).toEqual(rowDataRestored);
      expect(other.getDataAtRow(0)).toEqual(beforeRemove);

      redo();

      expect(hot.getData()).toEqual(rowData);
      expect(other.getDataAtRow(0)).toEqual(afterRemove);
    } finally {
      other?.destroy();
      hot?.destroy();
      hot = null;
      otherContainer.remove();
      engine.destroy();
    }
  });

  it('should keep the values when a later step is undone after the restored state was edited', () => {
    build({ data: [[10, '=A1*2'], [20, '=A2*2'], [null, null], [null, null]] });
    restoreRows();
    undo();
    hot.setDataAtCell(4, 0, 5);
    hot.alter('remove_row', 3);

    expect(hot.getData()).toEqual([[null, null], [10, 20], [20, 40], [5, null]]);

    undo();

    expect(hot.getData()).toEqual([[null, null], [10, 20], [20, 40], [null, null], [5, null]]);
  });

  it('should restore a #REF! the engine holds when the insert that follows skipped writing it back', () => {
    build({ data: [[10, '=A2*2'], [20, null], [null, null], [null, null]] });
    hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
    hot.alter('remove_row', 2);
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);
    hot.alter('insert_row_above', 0);

    const beforeRemove = hot.getData();

    hot.alter('remove_row', 3);

    const afterRemove = hot.getData();

    expect(String(beforeRemove[1][1])).toBe('#REF!');

    undo();

    expect(hot.getData()).toEqual(beforeRemove);

    redo();

    expect(hot.getData()).toEqual(afterRemove);

    undo();
    undo();

    expect(String(hot.getDataAtCell(0, 1))).toBe('#REF!');
  });

  describe('the steps that follow', () => {
    const serializedSheetReads = () => jest.spyOn(hot.getPlugin('formulas').engine, 'getSheetSerialized');

    it('should keep an edit step across a columns update after the order returned', () => {
      build({ data: [[10, '=A1*2', 7], [20, '=A2*2', 8], [null, null, null], [null, null, null]] });
      hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
      hot.alter('insert_row_above', 3);
      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
      hot.setDataAtCell(0, 0, 99);
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }] });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
      expect(hot.getData().slice(0, 2)).toEqual([[99, 198], [20, 40]]);

      undo();

      expect(hot.getPlugin('undoRedo').isRedoAvailable()).toBe(true);
      expect(hot.getData().slice(0, 2)).toEqual([[10, 20], [20, 40]]);
    });

    it('should undo a step recorded while stale against the columns a later update installed', () => {
      build({
        data: [
          { a: 10, b: '=A1*2+C1', c: 1, d: 100 },
          { a: 20, b: '=A2*2+C2', c: 2, d: 200 },
          { a: null, b: null, c: null, d: null },
          { a: null, b: null, c: null, d: null },
        ],
        columns: [{ data: 'a' }, { data: 'b' }, { data: 'c' }],
      });
      hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
      hot.alter('insert_row_above', 3);
      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
      hot.setDataAtCell(1, 0, 99);
      hot.updateSettings({ columns: [{ data: 'a' }, { data: 'b' }, { data: 'd' }] });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

      undo();

      expect(hot.getData().slice(0, 2)).toEqual([[10, 120, 100], [20, 240, 200]]);
    });

    it('should keep an edit step across a columns update after a sort that was undone and redone', () => {
      build({ data: [[3, '=A1*2'], [1, '=A2*2'], [2, '=A3*2']], columnSorting: true });

      const sorting = hot.getPlugin('columnSorting');

      sorting.sort({ column: 0, sortOrder: 'asc' });
      undo();
      redo();
      sorting.clearSort();
      hot.setDataAtCell(0, 0, 99);
      hot.updateSettings({ columns: [{ data: 1 }, { data: 0 }] });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

      undo();

      expect(hot.getPlugin('undoRedo').isRedoAvailable()).toBe(true);
    });

    it('should not serialize the sheet for an edit after a sort that was undone and redone', () => {
      build({ data: [[3, '=A1*2'], [1, '=A2*2'], [2, '=A3*2']], columnSorting: true });

      const sorting = hot.getPlugin('columnSorting');

      sorting.sort({ column: 0, sortOrder: 'asc' });
      undo();
      redo();
      sorting.clearSort();

      const reads = serializedSheetReads();

      hot.setDataAtCell(0, 0, 99);

      expect(reads).not.toHaveBeenCalled();
    });

    it('should undo a cell move made after the order returned', () => {
      build({
        data: [[10, '=A1*2', 7], [20, '=A2*2', null], [null, null, null], [null, null, null]],
        moveCells: true,
      });
      hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
      hot.alter('insert_row_above', 1);
      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);

      const start = hot.getData();
      const seven = hot._createCellCoords(1, 2);

      hot.getPlugin('moveCells').moveCellRange(
        hot._createCellRange(seven, seven, seven),
        hot._createCellCoords(4, 2)
      );

      const moved = hot.getData();

      expect(moved[4][2]).toBe(7);

      undo();

      expect(hot.getData()).toEqual(start);

      redo();

      expect(hot.getData()).toEqual(moved);

      undo();

      expect(hot.getData()).toEqual(start);
    });

    it('should drop a cell move step that reloads the sheet when a columns update changes the fields', () => {
      build({
        data: [[10, '=A1*2', 7], [20, '=A2*2', null], [null, null, null], [null, null, null]],
        moveCells: true,
      });
      hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
      hot.alter('insert_row_above', 1);
      hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);

      const seven = hot._createCellCoords(1, 2);

      hot.getPlugin('moveCells').moveCellRange(
        hot._createCellRange(seven, seven, seven),
        hot._createCellCoords(4, 2)
      );
      hot.updateSettings({ columns: [{ data: 1 }, { data: 0 }, { data: 2 }] });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    describe('with a trimmed column that holds a formula', () => {
      const trimColumn = (column) => {
        hot.columnIndexMapper.createAndRegisterIndexMap('trimmedColumn', 'trimming')
          .setValueAtIndex(column, true);
        hot.render();
      };

      it('should not serialize the sheet once a formula there matches the source data', () => {
        build({ data: [[10, '=A1*2', '=2+3'], [20, '=A2*2', null], [null, null, null], [null, null, null]] });
        trimColumn(2);
        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.alter('insert_row_above', 1);
        hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
        hot.alter('insert_row_above', 2);

        const reads = serializedSheetReads();

        hot.setDataAtCell(0, 0, 99);

        expect(reads).not.toHaveBeenCalled();
      });

      it('should keep recording the sheet when the rows are objects and a trimmed column holds a formula', () => {
        build({
          data: [
            { a: 10, b: '=A1*2', c: '=2+3' },
            { a: 20, b: '=A2*2', c: null },
            { a: null, b: null, c: null },
            { a: null, b: null, c: null },
          ],
        });
        trimColumn(2);
        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.alter('insert_row_above', 1);
        hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
        hot.alter('insert_row_above', 2);

        const reads = serializedSheetReads();

        hot.setDataAtCell(0, 0, 99);

        expect(reads).toHaveBeenCalled();
      });

      it('should restore the values a trimmed column feeds when a columns setting skips a source column', () => {
        build({
          data: [
            [10, '=A1*2+C1', '=A2+1', '=A1+1'],
            [20, '=A2*2+C2', '=A3+1', '=A2+1'],
            [null, null, null, null],
            [null, null, null, null],
          ],
          columns: [{ data: 0 }, { data: 1 }, { data: 3 }],
        });
        trimColumn(2);
        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.alter('insert_row_above', 1);
        hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
        hot.alter('remove_row', 4);

        const beforeInsert = hot.getData();

        hot.alter('insert_row_above', 0);
        undo();

        expect(beforeInsert).toEqual([[null, null], [10, 31], [20, 61], [null, null]]);
        expect(hot.getData()).toEqual(beforeInsert);
      });

      it('should restore a formula there that the engine rewrote and the source data could not take', () => {
        build({ data: [[10, '=A1*2', '=A1+1'], [20, '=A2*2', '=A2+1'], [null, null, null], [null, null, null]] });
        trimColumn(2);
        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.alter('insert_row_above', 1);
        hot.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
        hot.alter('insert_row_above', 0);

        const { engine, sheetId } = hot.getPlugin('formulas');
        const readColumn = () => engine.getSheetValues(sheetId).map(row => row[2]);
        const beforeRemove = readColumn();

        hot.alter('remove_row', 5);
        undo();

        expect(readColumn()).toEqual(beforeRemove);
      });
    });
  });
});
