import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const MERGE_KEYS = ['hidden', 'copyable', 'spanned', 'rowspan', 'colspan'];

/**
 * A merge stores `hidden` and `spanned` through `setCellMeta()`, so the UndoRedo journal takes them back on undo.
 * `afterGetCellMeta` stores `copyable: false`, `rowspan` and `colspan` on the same cells without a record, and the
 * journal cannot see them. The undo of the merge must take those off too, or the cells keep a span nothing backs
 * and a copy of the area drops the values of the cells the merge covered.
 */
describe('MergeCells cell meta after the undo of a merge', () => {
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

  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(6, 6),
      mergeCells: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads every cell of a range, so `afterGetCellMeta` stores the merge keys on each one, the way a render does.
   *
   * @param {number[]} range The range as `[startRow, startColumn, endRow, endColumn]`.
   */
  function readMeta([startRow, startColumn, endRow, endColumn]) {
    for (let row = startRow; row <= endRow; row++) {
      for (let column = startColumn; column <= endColumn; column++) {
        hot.getCellMeta(row, column);
      }
    }
  }

  /**
   * Lists the merge keys stored on the cells of a range, read without the `afterGetCellMeta` hook.
   *
   * @param {number[]} range The range as `[startRow, startColumn, endRow, endColumn]`.
   * @returns {string[]} Entries as `"row,column:key"`.
   */
  function storedMergeKeys([startRow, startColumn, endRow, endColumn]) {
    const found = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let column = startColumn; column <= endColumn; column++) {
        const meta = hot._getMetaManager().getCellMetaIfExists(row, column);

        MERGE_KEYS.forEach((key) => {
          if (meta && Object.prototype.hasOwnProperty.call(meta, key)) {
            found.push(`${row},${column}:${key}`);
          }
        });
      }
    }

    return found;
  }

  it('takes the span and the covered flags off the cells', () => {
    createGrid();

    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
    expect(storedMergeKeys([1, 1, 2, 2])).toEqual([]);
    expect(hot.getCellMeta(1, 1).rowspan).toBeUndefined();
    expect(hot.getCellMeta(1, 1).colspan).toBeUndefined();
    expect(hot.getCellMeta(2, 2).copyable).toBe(true);
    expect(hot.getCopyableText(1, 1, 2, 2)).toBe('B2\tC2\nB3\tC3');
  });

  it('keeps the cells clean through a redo and a second undo', () => {
    createGrid();

    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();
    readMeta([1, 1, 2, 2]);

    expect(hot.getCellMeta(1, 1).rowspan).toBe(2);
    expect(hot.getCellMeta(2, 2).copyable).toBe(false);

    hot.getPlugin('undoRedo').undo();

    expect(storedMergeKeys([1, 1, 2, 2])).toEqual([]);
    expect(hot.getCopyableText(1, 1, 2, 2)).toBe('B2\tC2\nB3\tC3');
  });

  it('leaves the flags of a merge the undo puts back', () => {
    createGrid();

    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.selectCell(0, 0, 3, 3);
    hot.getPlugin('mergeCells').mergeSelection();
    readMeta([0, 0, 3, 3]);
    // The render of the undo would run `afterGetCellMeta`, which writes the span keys of the restored merge again.
    hot.suspendRender();
    hot.getPlugin('undoRedo').undo();

    // The journal put back the `spanned` mark of the restored merge, and the cleanup leaves it there.
    expect(storedMergeKeys([1, 1, 1, 1])).toEqual(['1,1:spanned']);

    hot.resumeRender();
    readMeta([0, 0, 3, 3]);

    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.map(({ row, col, rowspan, colspan }) => (
      [row, col, rowspan, colspan]
    ))).toEqual([[1, 1, 2, 2]]);
    expect(hot.getCellMeta(1, 1).rowspan).toBe(2);
    expect(hot.getCellMeta(1, 1).copyable).toBe(true);
    expect(hot.getCellMeta(2, 2).copyable).toBe(false);
    // The outer merge covered B2, and the inner merge it puts back is drawn from it.
    expect(hot.getCopyableText(1, 1, 2, 2)).toBe('B2\t\n\t');
    expect(storedMergeKeys([0, 0, 0, 3])).toEqual([]);
    expect(storedMergeKeys([3, 0, 3, 3])).toEqual([]);
    expect(hot.getCopyableText(0, 0, 0, 3)).toBe('A1\tB1\tC1\tD1');
  });

  it('takes the span off the cell the inner merge was drawn from on the redo of a merge over it', () => {
    createGrid();

    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.selectCell(0, 0, 3, 3);
    hot.getPlugin('mergeCells').mergeSelection();
    hot.getPlugin('undoRedo').undo();
    readMeta([0, 0, 3, 3]);
    hot.getPlugin('undoRedo').redo();

    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.map(({ row, col, rowspan, colspan }) => (
      [row, col, rowspan, colspan]
    ))).toEqual([[0, 0, 4, 4]]);
    expect(storedMergeKeys([1, 1, 1, 1]).filter(entry => /rowspan|colspan|spanned/.test(entry))).toEqual([]);
    expect(hot.getCellMeta(1, 1).rowspan).toBeUndefined();
    expect(hot.getCellMeta(1, 1).colspan).toBeUndefined();
    expect(hot.getCellMeta(1, 1).hidden).toBe(true);
    expect(hot.getCellMeta(1, 1).copyable).toBe(false);
  });

  it('cleans the cell the restored merge is drawn from while its first row is trimmed', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('mergeCells').merge(1, 1, 3, 2);
    hot.getPlugin('trimRows').trimRow(1);
    readMeta([0, 0, 4, 3]);
    hot.selectCell(0, 0, 3, 3);
    hot.getPlugin('mergeCells').mergeSelection();
    readMeta([0, 0, 3, 3]);
    hot.getPlugin('undoRedo').undo();

    // Physical row 1 is trimmed, so the restored merge is drawn from physical row 2 (visual row 1).
    const drawnFrom = hot._getMetaManager().getCellMetaIfExists(2, 1);

    expect(drawnFrom && Object.prototype.hasOwnProperty.call(drawnFrom, 'hidden')).toBe(false);
    expect(drawnFrom && Object.prototype.hasOwnProperty.call(drawnFrom, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 1).copyable).toBe(true);
  });

  it('takes the span and the covered flags off the cells on the redo of an unmerge', () => {
    createGrid();

    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.getPlugin('mergeCells').unmerge(1, 1, 2, 2);
    hot.getPlugin('undoRedo').undo();
    readMeta([1, 1, 2, 2]);

    expect(hot.getCellMeta(1, 1).rowspan).toBe(2);
    expect(hot.getCellMeta(2, 2).copyable).toBe(false);

    hot.getPlugin('undoRedo').redo();
    // The merge emptied the cells it covered, and the unmerge does not bring their values back.
    hot.setDataAtCell(2, 2, 'new');

    expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
    expect(storedMergeKeys([1, 1, 2, 2])).toEqual([]);
    expect(hot.getCopyableText(1, 1, 2, 2)).toBe('B2\t\n\tnew');
  });

  it('keeps a `rowspan` and a `colspan` the user set before the merge', () => {
    createGrid();

    hot.setCellMeta(1, 1, 'rowspan', 3);
    hot.setCellMeta(1, 1, 'colspan', 4);
    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.getPlugin('undoRedo').undo();

    // The keys stay on the cell. Their values are the merge's: `afterGetCellMeta` overwrote the user's values
    // while the merge was drawn from the cell, a known limit that `AGENTS.md` describes.
    expect(storedMergeKeys([1, 1, 1, 1])).toEqual(['1,1:rowspan', '1,1:colspan']);
    expect(hot.getCellMeta(2, 2).copyable).toBe(true);
  });

  it('keeps a `copyable` the user set before the merge', () => {
    createGrid();

    hot.setCellMeta(2, 2, 'copyable', false);
    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    readMeta([1, 1, 2, 2]);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getCellMeta(2, 2).copyable).toBe(false);
    expect(hot.getCellMeta(2, 1).copyable).toBe(true);
    expect(hot.getCopyableText(1, 1, 2, 2)).toBe('B2\tC2\nB3\t');
  });

  /**
   * A step that also inserts or removes rows or columns is replayed with `alter()` before `restoreState()` runs,
   * so the merges the step recorded are numbered like the grid before the replay and cannot name the cells.
   */
  describe('of a step that also inserts or removes rows or columns', () => {
    const ALL_CELLS = [0, 0, 8, 8];

    /**
     * Lists the merges as `[row, col, rowspan, colspan]`.
     *
     * @returns {number[][]}
     */
    function merges() {
      return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan]);
    }

    /**
     * Returns the text a copy of the whole grid holds when every cell is copyable.
     *
     * @returns {string}
     */
    function plainText() {
      return hot.getData().map(row => row.join('\t')).join('\n');
    }

    /**
     * A `cells` function that gives the cell holding `F6` an unrecorded `copyable: false`, wherever the cell is.
     *
     * @param {number} row The visual row.
     * @param {number} column The visual column.
     * @returns {object}
     */
    function notCopyableF6(row, column) {
      return hot?.getSourceDataAtCell(hot.toPhysicalRow(row), column) === 'F6' ? { copyable: false } : {};
    }

    it('takes the span and the covered flags off the cells after an insert and a merge in one batch', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8) });

      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      });
      readMeta([0, 0, 8, 7]);
      hot.getPlugin('undoRedo').undo();

      expect(merges()).toEqual([]);
      expect(storedMergeKeys(ALL_CELLS)).toEqual([]);
      expect(hot.getCopyableText(0, 0, 2, 3)).toBe('A1\tB1\tC1\tD1\nA2\tB2\tC2\tD2\nA3\tB3\tC3\tD3');
    });

    it.each([
      ['a row removal before the merge', () => {
        hot.alter('remove_row', 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      }],
      ['a column insertion before the merge', () => {
        hot.alter('insert_col_start', 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      }],
      ['a row insertion after the merge', () => {
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.alter('insert_row_above', 0);
      }],
      ['a removal of a row inside the merge', () => {
        hot.getPlugin('mergeCells').merge(1, 1, 3, 2);
        hot.alter('remove_row', 2);
      }],
    ])('takes the span and the covered flags off the cells after %s in one batch', (_, step) => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8) });

      hot.batch(step);
      readMeta([0, 0, hot.countRows() - 1, hot.countCols() - 1]);
      hot.getPlugin('undoRedo').undo();

      expect(merges()).toEqual([]);
      expect(storedMergeKeys(ALL_CELLS)).toEqual([]);
      expect(hot.getCopyableText(0, 0, 7, 7)).toBe(plainText());
    });

    it.each([
      ['a row insertion', () => hot.alter('insert_row_above', 0)],
      ['a row removal', () => hot.alter('remove_row', 0)],
      ['a column insertion', () => hot.alter('insert_col_start', 0)],
    ])('takes the keys off the cells after %s and a merge over moved columns in one batch', (_, alter) => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8), manualColumnMove: true });

      // The merge spans visual columns whose physical columns are not the same numbers, or not next to each other.
      hot.getPlugin('manualColumnMove').moveColumn(5, 0);
      hot.batch(() => {
        alter();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      });
      readMeta([0, 0, hot.countRows() - 1, hot.countCols() - 1]);
      hot.getPlugin('undoRedo').undo();

      expect(merges()).toEqual([]);
      expect(storedMergeKeys(ALL_CELLS)).toEqual([]);
      expect(hot.getCopyableText(0, 0, 7, 7)).toBe(plainText());

      hot.getPlugin('undoRedo').redo();
      readMeta([0, 0, hot.countRows() - 1, hot.countCols() - 1]);

      expect(merges()).toEqual([[1, 1, 2, 2]]);
      expect(hot.getCellMeta(1, 1).rowspan).toBe(2);
      expect(hot.getCellMeta(2, 2).copyable).toBe(false);

      hot.getPlugin('undoRedo').undo();

      expect(storedMergeKeys(ALL_CELLS)).toEqual([]);
      expect(hot.getCopyableText(0, 0, 7, 7)).toBe(plainText());
    });

    it('keeps the cells clean through a redo and a second undo', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8) });

      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      });
      readMeta([0, 0, 8, 7]);
      hot.getPlugin('undoRedo').undo();
      hot.getPlugin('undoRedo').redo();
      readMeta([0, 0, 8, 7]);

      expect(merges()).toEqual([[1, 1, 2, 2]]);
      expect(hot.getCellMeta(1, 1).rowspan).toBe(2);
      expect(hot.getCellMeta(2, 2).copyable).toBe(false);

      hot.getPlugin('undoRedo').undo();

      expect(storedMergeKeys(ALL_CELLS)).toEqual([]);
      expect(hot.getCopyableText(0, 0, 7, 7)).toBe(plainText());
    });

    it('cleans the cell a merge the undo puts back is drawn from, when the step merged over it', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8) });

      hot.getPlugin('mergeCells').merge(2, 1, 3, 2);
      readMeta([0, 0, 7, 7]);
      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.selectCell(1, 0, 4, 3);
        hot.getPlugin('mergeCells').mergeSelection();
      });
      readMeta([0, 0, 8, 7]);
      // The render of the undo would run `afterGetCellMeta`, which writes the keys of the restored merge again.
      hot.suspendRender();
      hot.getPlugin('undoRedo').undo();

      expect(merges()).toEqual([[2, 1, 2, 2]]);
      // The outer merge covered C3, and the inner merge it puts back is drawn from it.
      expect(storedMergeKeys([2, 1, 2, 1])).toEqual(['2,1:spanned']);
      expect(storedMergeKeys([0, 0, 1, 3])).toEqual([]);
      expect(storedMergeKeys([2, 0, 3, 0])).toEqual([]);
      expect(storedMergeKeys([2, 3, 3, 3])).toEqual([]);

      hot.resumeRender();
      readMeta([0, 0, 7, 7]);

      expect(hot.getCellMeta(2, 1).rowspan).toBe(2);
      expect(hot.getCellMeta(2, 1).copyable).toBe(true);
      expect(hot.getCellMeta(3, 2).copyable).toBe(false);
      expect(hot.getCopyableText(0, 0, 1, 3)).toBe('A1\tB1\tC1\tD1\nA2\tB2\tC2\tD2');
    });

    it('takes the span and the covered flags off the cells on the redo of an insert and an unmerge', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8) });

      hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      readMeta([0, 0, 7, 7]);
      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.getPlugin('mergeCells').unmerge(2, 1, 3, 2);
      });
      hot.getPlugin('undoRedo').undo();
      readMeta([0, 0, 7, 7]);

      expect(merges()).toEqual([[1, 1, 2, 2]]);

      hot.getPlugin('undoRedo').redo();

      expect(merges()).toEqual([]);
      expect(storedMergeKeys(ALL_CELLS)).toEqual([]);
    });

    it('leaves the keys of a merge the step did not change', () => {
      createGrid({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        // An unrecorded key on the top-left of the unchanged merge, which `afterGetCellMeta` never writes there.
        cells: notCopyableF6,
      });

      hot.getPlugin('mergeCells').merge(5, 5, 6, 6);
      readMeta([0, 0, 7, 7]);
      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      });
      readMeta([0, 0, 8, 7]);
      hot.suspendRender();
      hot.getPlugin('undoRedo').undo();

      expect(merges()).toEqual([[5, 5, 2, 2]]);
      expect(storedMergeKeys([0, 0, 4, 7])).toEqual([]);
      expect(storedMergeKeys([5, 5, 6, 6])).toEqual([
        '5,5:copyable', '5,5:spanned', '5,5:rowspan', '5,5:colspan',
        '5,6:hidden', '5,6:copyable', '6,5:hidden', '6,5:copyable', '6,6:hidden', '6,6:copyable',
      ]);

      hot.resumeRender();
    });

    it('keeps a `copyable`, a `rowspan` and a `colspan` the user set before the step', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(8, 8) });

      hot.setCellMeta(1, 1, 'rowspan', 3);
      hot.setCellMeta(1, 1, 'colspan', 4);
      hot.setCellMeta(2, 2, 'copyable', false);
      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.getPlugin('mergeCells').merge(2, 1, 3, 2);
      });
      readMeta([0, 0, 8, 7]);
      hot.getPlugin('undoRedo').undo();

      expect(storedMergeKeys([1, 1, 2, 2])).toEqual(['1,1:rowspan', '1,1:colspan', '2,2:copyable']);
      expect(hot.getCellMeta(2, 2).copyable).toBe(false);
      expect(hot.getCellMeta(2, 1).copyable).toBe(true);
    });

    it('keeps a `copyable` a `cells` function gives a cell the merge did not cover', () => {
      createGrid({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        cells: notCopyableF6,
      });

      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
      });
      readMeta([0, 0, 8, 7]);
      // The render of the undo would run the `cells` function again and put the key back.
      hot.suspendRender();
      hot.getPlugin('undoRedo').undo();

      expect(storedMergeKeys([5, 5, 5, 5])).toEqual(['5,5:copyable']);
      expect(storedMergeKeys([0, 0, 4, 4])).toEqual([]);

      hot.resumeRender();
    });
  });
});
