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
    hot.getPlugin('undoRedo').undo();
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
});
