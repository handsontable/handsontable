import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * A merge whose first rows are trimmed or filtered out is drawn from the next visible row. That cell was
 * covered by the merge before, so `afterGetCellMeta` had stored `hidden` and `copyable: false` on it. Once it
 * is the top-left those flags describe nothing, and AutoRowSize skips every cell with `hidden`, so the text of
 * the merge was never measured and the row headers came out shorter than their rows.
 */
describe('MergeCells re-anchored top-left cell meta', () => {
  const MERGE = { row: 1, col: 4, rowspan: 3, colspan: 2 };
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
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      mergeCells: [MERGE],
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    // The render path reads the meta of every drawn cell, which is what stores the covered flags.
    for (let row = MERGE.row; row < MERGE.row + MERGE.rowspan; row++) {
      for (let col = MERGE.col; col < MERGE.col + MERGE.colspan; col++) {
        hot.getCellMeta(row, col);
      }
    }

    return hot;
  }

  /**
   * Reads what is stored for a cell, by physical index, without running the `afterGetCellMeta` hook that
   * would write the flags again.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @returns {object|undefined} The stored cell meta, or `undefined` when none is stored.
   */
  function storedMeta(physicalRow, physicalColumn) {
    return hot._getMetaManager().getCellMetaIfExists(physicalRow, physicalColumn);
  }

  function hasStoredFlag(physicalRow, physicalColumn, key) {
    const meta = storedMeta(physicalRow, physicalColumn);

    return !!meta && Object.prototype.hasOwnProperty.call(meta, key);
  }

  function filterOutRowTwo() {
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'neq', ['A2']);
    filters.filter();
  }

  it('should check the precondition: every covered cell stores `hidden` before the trim', () => {
    createGrid({ trimRows: true });

    expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);
    expect(hasStoredFlag(2, 4, 'copyable')).toBe(true);
    expect(hasStoredFlag(1, 4, 'hidden')).toBe(false);
  });

  it('should clear the covered flags from the cell a trim of the first merge row makes the top-left', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('trimRows').trimRows([1]);
    hot.render();

    // Visual row 1 is physical row 2 now.
    expect(hot.toPhysicalRow(1)).toBe(2);
    expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 4).copyable).not.toBe(false);
    expect(hot.getCellMeta(1, 4).spanned).toBe(true);
    expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
  });

  it('should keep the covered flags on the cells the merge still covers', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('trimRows').trimRows([1]);
    hot.render();

    expect(hot.getCellMeta(1, 5).hidden).toBe(true);
    expect(hot.getCellMeta(1, 5).copyable).toBe(false);
    expect(hot.getCellMeta(2, 4).hidden).toBe(true);
    expect(hot.getCellMeta(2, 5).hidden).toBe(true);
  });

  it('should clear the covered flags when the trim re-anchors the merge two rows down', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('trimRows').trimRows([1, 2]);
    hot.render();

    expect(hot.toPhysicalRow(1)).toBe(3);
    expect(hasStoredFlag(3, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(3, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 5).hidden).toBe(true);
  });

  it('should clear the covered flags when a filter re-anchors the merge', () => {
    createGrid({ filters: true });

    filterOutRowTwo();
    hot.render();

    expect(hot.toPhysicalRow(1)).toBe(2);
    expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 4).spanned).toBe(true);
  });

  it('should leave the original top-left unflagged and the covered cells flagged after trim and untrim', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('trimRows').trimRows([1]);
    hot.render();
    hot.getPlugin('trimRows').untrimRows([1]);
    hot.render();

    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
    expect(hot.getCellMeta(2, 4).hidden).toBe(true);
    expect(hot.getCellMeta(3, 4).hidden).toBe(true);
    expect(hot.getCellMeta(1, 5).hidden).toBe(true);
  });

  it('should clear the covered flags when the merge comes back from a fully trimmed state on another row', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('trimRows').trimRows([1, 2, 3]);
    hot.render();
    hot.getPlugin('trimRows').untrimRows([2]);
    hot.render();

    expect(hot.toPhysicalRow(1)).toBe(2);
    expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
  });

  it('should clear the covered flags when another row becomes the top-left with the same visual row and span', () => {
    createGrid({ trimRows: true });

    hot.getPlugin('trimRows').trimRows([2]);
    hot.render();

    // The visible rows of the merge are physical 1 and 3: the top-left is physical row 1, drawn at visual row 1.
    expect(hot.toPhysicalRow(1)).toBe(1);
    expect(hot.getCellMeta(1, 4).rowspan).toBe(2);

    // One cache update swaps the trimmed row: physical row 2 is visible again and becomes the top-left, at the
    // same visual row, and the span stays 2. Nothing in the merge's derived geometry changes.
    hot.rowIndexMapper.suspendOperations();
    hot.getPlugin('trimRows').untrimRows([2]);
    hot.getPlugin('trimRows').trimRows([1]);
    hot.rowIndexMapper.resumeOperations();
    hot.render();

    expect(hot.toPhysicalRow(1)).toBe(2);
    expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
    expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
  });

  it('should clear the covered flags when removing the first row of the merge makes the next row its top-left', () => {
    createGrid();

    hot.alter('remove_row', 1);
    hot.render();

    // The merge covers the rows that were 2 and 3, now 1 and 2.
    expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
    expect(hasStoredFlag(1, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(1, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(2, 4).hidden).toBe(true);
  });

  it('should keep a `copyable: false` the user set on a top-left that was never covered', () => {
    createGrid({ trimRows: true });

    hot.setCellMeta(1, 4, 'copyable', false);

    // Trimming the last merge row changes the span only, the top-left stays on physical row 1.
    hot.getPlugin('trimRows').trimRows([3]);
    hot.render();

    expect(hot.toPhysicalRow(1)).toBe(1);
    expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
    expect(hot.getCellMeta(1, 4).copyable).toBe(false);
  });

  it('should keep a `copyable: false` the user set on a covered cell that a trim makes the top-left', () => {
    createGrid({ trimRows: true });

    hot.setCellMeta(2, 4, 'copyable', false);
    hot.getCellMeta(2, 4);

    hot.getPlugin('trimRows').trimRows([1]);
    hot.render();

    expect(hot.toPhysicalRow(1)).toBe(2);
    expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(1, 4).copyable).toBe(false);
    expect(hot.getCopyableText(1, 4, 1, 4)).toBe('');
  });

  it('should clear the covered flags when removing the first column of the merge re-anchors it', () => {
    createGrid();

    hot.alter('remove_col', 4);
    hot.render();

    // The merge covers the column that was 5, now 4, and keeps its three rows.
    expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
    expect(hot.getCellMeta(1, 4).colspan).toBe(1);
    expect(hasStoredFlag(1, 4, 'hidden')).toBe(false);
    expect(hasStoredFlag(1, 4, 'copyable')).toBe(false);
    expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
    expect(hot.getCellMeta(2, 4).hidden).toBe(true);
  });
});
