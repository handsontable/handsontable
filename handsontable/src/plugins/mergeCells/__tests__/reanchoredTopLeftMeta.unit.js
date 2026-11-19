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

  const SPAN_KEYS = ['spanned', 'rowspan', 'colspan'];

  /**
   * Asserts that no cell holds a span of its own unless a merge is drawn from it. Reads the stored meta only,
   * so the `afterGetCellMeta` hook cannot write the keys back first. A merge that was purged while all of its
   * rows are trimmed is not in the lookup any more and is drawn from no cell: it is told apart from the others
   * by the lookup, not by its stale coordinates, which can still name a cell in range.
   */
  function expectSpanKeysOnlyOnTopLefts() {
    const { mergedCellsCollection } = hot.getPlugin('mergeCells');
    const topLefts = new Set(
      mergedCellsCollection.mergedCells
        .filter(merge => mergedCellsCollection.get(merge.row, merge.col) === merge)
        .map(({ row, col }) => `${hot.toPhysicalRow(row)}:${hot.toPhysicalColumn(col)}`)
    );

    for (let physicalRow = 0; physicalRow < hot.countSourceRows(); physicalRow++) {
      for (let physicalColumn = 0; physicalColumn < hot.countSourceCols(); physicalColumn++) {
        if (!topLefts.has(`${physicalRow}:${physicalColumn}`)) {
          SPAN_KEYS.forEach((key) => {
            expect([physicalRow, physicalColumn, key, hasStoredFlag(physicalRow, physicalColumn, key)])
              .toEqual([physicalRow, physicalColumn, key, false]);
          });
        }
      }
    }
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

  describe('after a move or a freeze that splits the merge', () => {
    const TEXT = 'new top-left text';

    /**
     * Asserts that no merge is drawn from a cell that still holds the flags it stored while covered.
     * Reads the stored meta only, so the `afterGetCellMeta` hook cannot write the flags back first.
     */
    function expectEveryTopLeftWithoutCoveredFlags() {
      const { mergedCells } = hot.getPlugin('mergeCells').mergedCellsCollection;

      expect(mergedCells.length).toBeGreaterThan(0);

      mergedCells.forEach(({ row, col }) => {
        const physicalRow = hot.toPhysicalRow(row);
        const physicalColumn = hot.toPhysicalColumn(col);

        expect(hasStoredFlag(physicalRow, physicalColumn, 'hidden')).toBe(false);
        expect(hasStoredFlag(physicalRow, physicalColumn, 'copyable')).toBe(false);
      });
    }

    it('should clear the covered flags from the top-left of a fragment after `moveRow(1, 6)`', () => {
      createGrid({ manualRowMove: true, autoRowSize: true });

      // Precondition: the cell the fragment is drawn from stores the flags while the merge covers it.
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);

      hot.getPlugin('manualRowMove').moveRow(1, 6);
      hot.setSourceDataAtCell(2, 4, TEXT);

      // The 2x2 fragment is drawn at visual (1, 4) from physical (2, 4).
      expect(hot.toPhysicalRow(1)).toBe(2);
      expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
      expectEveryTopLeftWithoutCoveredFlags();
      expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
      expect(hot.getCopyableText(1, 4, 1, 4)).toBe(TEXT);
    });

    it('should clear the covered flags from the top-left of a fragment after `moveRow(2, 0)`', () => {
      createGrid({ manualRowMove: true, autoRowSize: true });

      expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);

      hot.getPlugin('manualRowMove').moveRow(2, 0);
      hot.setSourceDataAtCell(2, 4, TEXT);

      // Physical row 2 is the first visual row now, and the merge was split around it.
      expect(hot.toPhysicalRow(0)).toBe(2);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expectEveryTopLeftWithoutCoveredFlags();
      expect(hot.getCellMeta(hot.toVisualRow(2), 4).hidden).toBeUndefined();
      expect(hot.getCopyableText(hot.toVisualRow(2), 4, hot.toVisualRow(2), 4)).toBe(TEXT);
    });

    it('should clear the covered flags from the top-left of a fragment after `moveColumn(4, 8)`', () => {
      createGrid({ manualColumnMove: true, autoRowSize: true });

      expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);

      hot.getPlugin('manualColumnMove').moveColumn(4, 8);
      hot.setSourceDataAtCell(1, 5, TEXT);

      // The 3x1 fragment is drawn at visual (1, 4) from physical (1, 5).
      expect(hot.toPhysicalColumn(4)).toBe(5);
      expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
      expect(hasStoredFlag(1, 5, 'hidden')).toBe(false);
      expect(hasStoredFlag(1, 5, 'copyable')).toBe(false);
      expectEveryTopLeftWithoutCoveredFlags();
      expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
      expect(hot.getCopyableText(1, 4, 1, 4)).toBe(TEXT);
    });

    it('should clear the covered flags from the top-left of a fragment after a column freeze', () => {
      createGrid({ manualColumnFreeze: true, autoRowSize: true });

      hot.getPlugin('manualColumnFreeze').freezeColumn(5);
      hot.setSourceDataAtCell(1, 5, TEXT);

      // Physical column 5 is the first visual column now, and the merge was split between it and column 4.
      expect(hot.toPhysicalColumn(0)).toBe(5);
      expectEveryTopLeftWithoutCoveredFlags();
      expect(hot.getCellMeta(1, 0).hidden).toBeUndefined();
      expect(hot.getCopyableText(1, 0, 1, 0)).toBe(TEXT);
    });

    it('should clear the covered flags from the top-left of a fragment after a column unfreeze', () => {
      // Columns 0-4 are frozen. Unfreezing column 0 puts it behind the frozen band, between the merge's two columns.
      createGrid({ manualColumnFreeze: true, autoRowSize: true, fixedColumnsStart: 5 });

      expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.setSourceDataAtCell(1, 5, TEXT);

      // Physical column 0 sits at visual column 4 now, and the merge's columns 4 and 5 are two blocks apart.
      expect(hot.toPhysicalColumn(4)).toBe(0);
      expect(hot.getCellMeta(1, 5).rowspan).toBe(3);
      expect(hasStoredFlag(1, 5, 'hidden')).toBe(false);
      expect(hasStoredFlag(1, 5, 'copyable')).toBe(false);
      expectEveryTopLeftWithoutCoveredFlags();
      expect(hot.getCopyableText(1, hot.toVisualColumn(5), 1, hot.toVisualColumn(5))).toBe(TEXT);
    });

    it('should keep the covered flags on the cells the fragment still covers', () => {
      createGrid({ manualRowMove: true });

      hot.getPlugin('manualRowMove').moveRow(1, 6);

      expect(hot.getCellMeta(1, 5).hidden).toBe(true);
      expect(hot.getCellMeta(1, 5).copyable).toBe(false);
      expect(hot.getCellMeta(2, 4).hidden).toBe(true);
      expect(hot.getCellMeta(2, 5).hidden).toBe(true);
    });

    it('should keep a `copyable: false` the user set on a covered cell that a move makes the top-left', () => {
      createGrid({ manualRowMove: true });

      hot.setCellMeta(2, 4, 'copyable', false);
      hot.getCellMeta(2, 4);

      hot.getPlugin('manualRowMove').moveRow(1, 6);

      expect(hot.toPhysicalRow(1)).toBe(2);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hot.getCellMeta(1, 4).hidden).toBeUndefined();
      expect(hot.getCellMeta(1, 4).copyable).toBe(false);
    });

    it('should keep a `copyable: false` the user set on a top-left that was never covered', () => {
      createGrid({ manualRowMove: true });

      hot.setCellMeta(1, 4, 'copyable', false);

      // The move leaves the merge alone: its top-left is the cell it always was.
      hot.getPlugin('manualRowMove').moveRow(7, 8);

      expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
      expect(hot.getCellMeta(1, 4).copyable).toBe(false);
    });

    it('should leave the data and the meta alone on a move when the grid has no merge', () => {
      createGrid({ manualRowMove: true, mergeCells: true });

      hot.getPlugin('manualRowMove').moveRow(1, 6);

      expect(hot.getDataAtCell(1, 0)).toBe('A3');
      expect(hot.getDataAtCell(6, 0)).toBe('A2');
      expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
    });

    it('should clear the covered flags from the top-left of a merge a row move keeps whole', () => {
      createGrid({ manualRowMove: true, autoRowSize: true });

      // The merge keeps its three rows, and is drawn from physical row 2, which it covered before.
      hot.getPlugin('manualRowMove').moveRow(1, 2);
      hot.setSourceDataAtCell(2, 4, TEXT);

      expect(hot.toPhysicalRow(1)).toBe(2);
      expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
      expect(hot.getCopyableText(1, 4, 1, 4)).toBe(TEXT);
    });

    it('should clear the covered flags from the top-left of a merge a column move keeps whole', () => {
      createGrid({ manualColumnMove: true, autoRowSize: true });

      // The merge keeps its two columns, and is drawn from physical column 5, which it covered before.
      hot.getPlugin('manualColumnMove').moveColumn(4, 5);
      hot.setSourceDataAtCell(1, 5, TEXT);

      expect(hot.toPhysicalColumn(4)).toBe(5);
      expect(hot.getCellMeta(1, 4).colspan).toBe(2);
      expect(hasStoredFlag(1, 5, 'hidden')).toBe(false);
      expect(hasStoredFlag(1, 5, 'copyable')).toBe(false);
      expect(hot.getCopyableText(1, 4, 1, 4)).toBe(TEXT);
    });

    it('should clear the covered flags from the cells of a merge a row move breaks into single cells', () => {
      createGrid({ manualRowMove: true, autoRowSize: true, mergeCells: [{ row: 1, col: 4, rowspan: 2, colspan: 1 }] });

      expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);

      // The foreign row lands between the merge's two rows: no fragment is more than one cell.
      hot.getPlugin('manualRowMove').moveRow(5, 2);
      hot.setSourceDataAtCell(2, 4, TEXT);

      expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
      expect(hot.getCopyableText(hot.toVisualRow(2), 4, hot.toVisualRow(2), 4)).toBe(TEXT);
    });

    it('should clear the covered flags from a row a move takes out of a merge that stays in one piece', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }] });

      expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);

      hot.getPlugin('manualRowMove').moveRow(2, 7);
      hot.setSourceDataAtCell(2, 4, TEXT);

      // Physical row 2 sits at visual row 7 now, alone, and belongs to no merge.
      expect(hot.toVisualRow(2)).toBe(7);
      expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hasStoredFlag(2, 4, 'copyable')).toBe(false);
      expect(hot.getCopyableText(7, 4, 7, 4)).toBe(TEXT);
      // The row the merge still covers keeps its flags.
      expect(hasStoredFlag(3, 4, 'hidden')).toBe(true);
    });

    it('should clear the covered flags from a column a move takes out of a merge that stays in one piece', () => {
      createGrid({ manualColumnMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }] });

      expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);

      hot.getPlugin('manualColumnMove').moveColumn(5, 8);
      hot.setSourceDataAtCell(1, 5, TEXT);

      expect(hot.toVisualColumn(5)).toBe(8);
      expect(hot.getCellMeta(1, 4).colspan).toBe(2);
      expect(hasStoredFlag(1, 5, 'hidden')).toBe(false);
      expect(hasStoredFlag(1, 5, 'copyable')).toBe(false);
      expect(hot.getCopyableText(1, 8, 1, 8)).toBe(TEXT);
    });

    it('should keep a `copyable: false` the user set on a cell a move takes out of a merge', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }] });

      hot.setCellMeta(2, 4, 'copyable', false);
      hot.getCellMeta(2, 4);

      hot.getPlugin('manualRowMove').moveRow(2, 7);

      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hot.getCellMeta(7, 4).copyable).toBe(false);
    });
  });

  describe('span keys after a move or a freeze', () => {
    it('should check the precondition: the top-left stores the span keys before the move', () => {
      createGrid({ manualRowMove: true });

      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));
    });

    it('should clear the span keys from the former top-left a row move leaves in no merge', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }] });

      hot.getPlugin('manualRowMove').moveRow(1, 6);

      // The 2x1 fragment is drawn from physical (2, 4); physical (1, 4) sits alone at visual row 6.
      expect(hot.toPhysicalRow(1)).toBe(2);
      expect(hot.toVisualRow(1)).toBe(6);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expectSpanKeysOnlyOnTopLefts();
      expect(hot.getCellMeta(6, 4).spanned).toBeUndefined();
      expect(hot.getCellMeta(6, 4).rowspan).toBeUndefined();
      expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
    });

    it('should clear the span keys from the former top-left a merge a row move breaks into single cells', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 2, colspan: 1 }] });

      expect(hasStoredFlag(1, 4, 'spanned')).toBe(true);

      hot.getPlugin('manualRowMove').moveRow(5, 2);

      expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expect(hot.getCellMeta(1, 4).rowspan).toBeUndefined();
    });

    it('should clear the span keys from the row a move takes out of a merge that stays in one piece', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }] });

      hot.getPlugin('manualRowMove').moveRow(1, 7);

      // The merge is drawn from physical (2, 4) now, and physical (1, 4) belongs to no merge.
      expect(hot.toPhysicalRow(1)).toBe(2);
      expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expectSpanKeysOnlyOnTopLefts();
    });

    it('should clear the span keys from the former top-left of a merge a row move keeps whole', () => {
      createGrid({ manualRowMove: true });

      // The merge keeps its three rows and is drawn from physical row 2. Physical row 1 is covered, not the top-left.
      hot.getPlugin('manualRowMove').moveRow(1, 2);

      expect(hot.toPhysicalRow(1)).toBe(2);
      expect(hot.toVisualRow(1)).toBe(2);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expectSpanKeysOnlyOnTopLefts();
      expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
      expect(hot.getCellMeta(2, 4).rowspan).toBeUndefined();
      expect(hot.getCellMeta(2, 4).hidden).toBe(true);
    });

    it('should clear the span keys from the former top-left of a merge a column move keeps whole', () => {
      createGrid({ manualColumnMove: true });

      hot.getPlugin('manualColumnMove').moveColumn(4, 5);

      // The merge keeps its two columns and is drawn from physical column 5.
      expect(hot.toPhysicalColumn(4)).toBe(5);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expectSpanKeysOnlyOnTopLefts();
      expect(hot.getCellMeta(1, 4).colspan).toBe(2);
      expect(hot.getCellMeta(1, 5).colspan).toBeUndefined();
    });

    it('should clear the span keys from the former top-left a column move leaves in no merge', () => {
      createGrid({ manualColumnMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }] });

      hot.getPlugin('manualColumnMove').moveColumn(4, 8);

      // The merge is drawn from physical (1, 5) now, and physical (1, 4) sits alone at visual column 8.
      expect(hot.toPhysicalColumn(4)).toBe(5);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expectSpanKeysOnlyOnTopLefts();
      expect(hot.getCellMeta(1, 4).colspan).toBe(2);
      expect(hot.getCellMeta(1, 8).colspan).toBeUndefined();
    });

    it('should clear the span keys from the former top-left a column freeze leaves in no merge', () => {
      createGrid({ manualColumnFreeze: true, mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }] });

      hot.getPlugin('manualColumnFreeze').freezeColumn(4);

      // Physical column 4 is the first visual column and no merge is drawn from it. The merge keeps columns 5 and 6.
      expect(hot.toPhysicalColumn(0)).toBe(4);
      expect(hot.getCellMeta(1, 5).colspan).toBe(2);
      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(false));
      expectSpanKeysOnlyOnTopLefts();
      expect(hot.getCellMeta(1, 0).colspan).toBeUndefined();
    });

    it('should leave a span only on the cells a merge is drawn from after a column freeze splits it', () => {
      createGrid({ manualColumnFreeze: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 3 }] });

      hot.getPlugin('manualColumnFreeze').freezeColumn(5);

      expect(hot.toPhysicalColumn(0)).toBe(5);
      expectSpanKeysOnlyOnTopLefts();
      expect(hot.getCellMeta(1, 0).rowspan).toBe(3);
      expect(hot.getCellMeta(1, 0).colspan).toBe(1);
    });

    it('should keep the span keys of a merge a move does not touch', () => {
      createGrid({ manualRowMove: true });

      hot.getPlugin('manualRowMove').moveRow(7, 8);

      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));
      expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
      expect(hot.getCellMeta(1, 4).colspan).toBe(2);
    });

    it('should keep a `rowspan` and a `colspan` recorded on the former top-left', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }] });

      hot.setCellMeta(1, 4, 'rowspan', 9);
      hot.setCellMeta(1, 4, 'colspan', 8);

      hot.getPlugin('manualRowMove').moveRow(1, 6);

      // `spanned` is the merge's own mark and goes, the recorded keys are the user's and stay.
      expect(hasStoredFlag(1, 4, 'spanned')).toBe(false);
      expect(hasStoredFlag(1, 4, 'rowspan')).toBe(true);
      expect(hasStoredFlag(1, 4, 'colspan')).toBe(true);
    });

    it('should keep a `rowspan` the user set on a cell that no merge stored a span on', () => {
      createGrid({ manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 2, colspan: 1 }] });

      // The covered cell carries no `spanned`, so its `rowspan` is not the merge's.
      hot.setCellMeta(2, 4, 'rowspan', 9);

      hot.getPlugin('manualRowMove').moveRow(5, 2);

      expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
      expect(hasStoredFlag(2, 4, 'hidden')).toBe(false);
      expect(hot.getCellMeta(hot.toVisualRow(2), 4).rowspan).toBe(9);
    });
  });

  /**
   * A trim or a filter draws the merge from the next visible row, and `afterGetCellMeta` stores the span keys
   * there. Nothing took them off once the original row came back, a move or a freeze while a row was trimmed
   * left them on the former top-left, and so did an undo or a redo of a move.
   */
  describe('span keys after a trim is lifted, a move while a row is trimmed, and an undo', () => {
    function hasAnySpanKey(physicalRow, physicalColumn) {
      return SPAN_KEYS.some(key => hasStoredFlag(physicalRow, physicalColumn, key));
    }

    function trimRowEight() {
      hot.getPlugin('trimRows').trimRows([8]);
    }

    it('should check the precondition: the top-left stores the span keys and a covered cell does not', () => {
      createGrid({ trimRows: true });

      SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));
      expect(hasAnySpanKey(2, 4)).toBe(false);
    });

    describe('when a trim or a filter is lifted', () => {
      it('should clear the span keys from the temporary top-left after `untrimRows()`', () => {
        createGrid({ trimRows: true });

        hot.getPlugin('trimRows').trimRows([1]);
        hot.render();

        // The merge is drawn from physical row 2 while row 1 is trimmed.
        SPAN_KEYS.forEach(key => expect(hasStoredFlag(2, 4, key)).toBe(true));

        hot.getPlugin('trimRows').untrimRows([1]);

        expect(hasAnySpanKey(2, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expect(hot.getCellMeta(1, 4).colspan).toBe(2);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the temporary top-left after the filter is cleared', () => {
        createGrid({ filters: true });

        filterOutRowTwo();
        hot.render();

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(2, 4, key)).toBe(true));

        hot.getPlugin('filters').clearConditions();
        hot.getPlugin('filters').filter();

        expect(hasAnySpanKey(2, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys of a merge that was purged while all of its rows were trimmed', () => {
        createGrid({ trimRows: true });

        const trimRows = hot.getPlugin('trimRows');

        trimRows.trimRows([1]);
        hot.render();

        // Physical row 2 is the top-left now. Trimming the rest of the merge purges it.
        SPAN_KEYS.forEach(key => expect(hasStoredFlag(2, 4, key)).toBe(true));

        trimRows.trimRows([2, 3]);

        expect(hasAnySpanKey(2, 4)).toBe(false);

        trimRows.untrimRows([1]);
        hot.render();
        trimRows.untrimRows([2, 3]);
        hot.render();

        expect(hasAnySpanKey(2, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should keep the span keys of the cell the merge is drawn from', () => {
        createGrid({ trimRows: true });

        hot.getPlugin('trimRows').trimRows([8]);
        hot.getPlugin('trimRows').untrimRows([8]);

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));
      });

      it('should keep a `rowspan` and a `colspan` recorded on the temporary top-left', () => {
        createGrid({ trimRows: true });

        hot.getPlugin('trimRows').trimRows([1]);
        hot.setCellMeta(1, 4, 'rowspan', 9);
        hot.setCellMeta(1, 4, 'colspan', 8);
        hot.getPlugin('trimRows').untrimRows([1]);

        // `spanned` is the merge's own mark and goes, the recorded keys are the user's and stay.
        expect(hasStoredFlag(2, 4, 'spanned')).toBe(false);
        expect(hasStoredFlag(2, 4, 'rowspan')).toBe(true);
        expect(hasStoredFlag(2, 4, 'colspan')).toBe(true);
      });

      it('should keep a `rowspan` the user set on a cell that no merge is drawn from', () => {
        createGrid({ trimRows: true });

        hot.setCellMeta(6, 0, 'rowspan', 9);
        hot.getPlugin('trimRows').trimRows([1]);
        hot.getPlugin('trimRows').untrimRows([1]);

        expect(hasStoredFlag(6, 0, 'rowspan')).toBe(true);
      });
    });

    describe('when a column move or a freeze happens while a row is trimmed', () => {
      it('should clear the span keys from the former top-left after `moveColumn()`', () => {
        createGrid({ trimRows: true, manualColumnMove: true });

        trimRowEight();
        hot.getPlugin('manualColumnMove').moveColumn(4, 5);

        // Physical column 5 is drawn at visual column 4 now, and the merge is drawn from it.
        expect(hot.toPhysicalColumn(4)).toBe(5);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left after `moveColumn()` on a filtered grid', () => {
        createGrid({ filters: true, manualColumnMove: true });

        const filters = hot.getPlugin('filters');

        filters.addCondition(0, 'neq', ['A9']);
        filters.filter();
        hot.getPlugin('manualColumnMove').moveColumn(4, 5);

        expect(hasAnySpanKey(1, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left after a column freeze', () => {
        createGrid({
          trimRows: true,
          manualColumnFreeze: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        trimRowEight();
        hot.getPlugin('manualColumnFreeze').freezeColumn(4);

        // Physical column 4 is the first visual column and no merge is drawn from it. The merge keeps columns 5 and 6.
        expect(hot.toPhysicalColumn(0)).toBe(4);
        expect(hot.getCellMeta(1, 5).colspan).toBe(2);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left after a column unfreeze', () => {
        // Columns 0-4 are frozen. Unfreezing column 0 puts it behind the frozen band, after the merge's first column.
        createGrid({
          trimRows: true,
          manualColumnFreeze: true,
          fixedColumnsStart: 5,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        trimRowEight();
        hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);

        // Physical column 4 sits alone at visual column 3, and the merge keeps columns 5 and 6.
        expect(hot.toPhysicalColumn(4)).toBe(0);
        expect(hot.getCellMeta(1, 5).colspan).toBe(2);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left a row move leaves in no merge', () => {
        createGrid({
          trimRows: true,
          manualRowMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }],
        });

        trimRowEight();

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));

        hot.getPlugin('manualRowMove').moveRow(1, 6);

        // The 2x1 fragment is drawn from physical (2, 4); physical (1, 4) sits alone at visual row 6.
        expect(hot.toPhysicalRow(1)).toBe(2);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(2);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left of a merge a row move keeps whole', () => {
        createGrid({ trimRows: true, manualRowMove: true });

        trimRowEight();
        hot.getPlugin('manualRowMove').moveRow(2, 1);

        // Physical row 2 is drawn at visual row 1 now, and the merge is drawn from it.
        expect(hot.toPhysicalRow(1)).toBe(2);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });
    });

    describe('when a move takes a cell out of every merge while a row is trimmed', () => {
      const TEXT = 'released';

      function expectNoCoveredFlags(physicalRow, physicalColumn) {
        expect(hasStoredFlag(physicalRow, physicalColumn, 'hidden')).toBe(false);
        expect(hasStoredFlag(physicalRow, physicalColumn, 'copyable')).toBe(false);
      }

      it('should clear the covered flags from a cell a row move takes out of a merge', () => {
        createGrid({
          trimRows: true,
          manualRowMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }],
        });

        trimRowEight();

        expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);

        hot.getPlugin('manualRowMove').moveRow(2, 7);

        const visualRow = hot.toVisualRow(2);

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.get(visualRow, 4)).toBe(false);
        expectNoCoveredFlags(2, 4);

        hot.setSourceDataAtCell(2, 4, TEXT);

        expect(hot.getCopyableText(visualRow, 4, visualRow, 4)).toBe(TEXT);
      });

      it('should clear the covered flags from a cell a column move takes out of a merge', () => {
        createGrid({
          trimRows: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        trimRowEight();

        expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);

        hot.getPlugin('manualColumnMove').moveColumn(5, 8);

        const visualColumn = hot.toVisualColumn(5);

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.get(1, visualColumn)).toBe(false);
        expectNoCoveredFlags(1, 5);
      });

      it('should clear the covered flags from a cell a column freeze takes out of a merge', () => {
        createGrid({
          trimRows: true,
          manualColumnFreeze: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        hot.getCellMeta(1, 6);
        trimRowEight();

        expect(hasStoredFlag(1, 6, 'hidden')).toBe(true);

        hot.getPlugin('manualColumnFreeze').freezeColumn(6);

        expect(hot.toPhysicalColumn(0)).toBe(6);
        expectNoCoveredFlags(1, 6);
      });

      it('should clear the covered flags from a cell a column move takes out of a merge whose rows are all trimmed', () => {
        createGrid({
          trimRows: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        hot.getPlugin('trimRows').trimRows([1]);

        expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);

        // The merge keeps columns 4 and 6, and column 5 leaves it.
        hot.getPlugin('manualColumnMove').moveColumn(5, 8);
        hot.getPlugin('trimRows').untrimRows([1]);
        hot.render();

        const visualColumn = hot.toVisualColumn(5);

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.get(1, visualColumn)).toBe(false);
        expectNoCoveredFlags(1, 5);

        hot.setSourceDataAtCell(1, 5, TEXT);

        expect(hot.getCopyableText(1, visualColumn, 1, visualColumn)).toBe(TEXT);
      });

      it('should clear the covered flags from a cell a move took out of a merge after the undo and the redo', () => {
        createGrid({
          undo: true,
          trimRows: true,
          manualRowMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }],
        });

        trimRowEight();
        hot.getPlugin('manualRowMove').moveRow(2, 7);

        expectNoCoveredFlags(2, 4);

        hot.getPlugin('undoRedo').undo();
        hot.render();

        // The undone merge covers the cell again, and reading its meta stores the flags on it.
        hot.getCellMeta(hot.toVisualRow(2), 4);

        expect(hasStoredFlag(2, 4, 'hidden')).toBe(true);

        hot.getPlugin('undoRedo').redo();

        expectNoCoveredFlags(2, 4);

        hot.setSourceDataAtCell(2, 4, TEXT);

        const visualRow = hot.toVisualRow(2);

        expect(hot.getCopyableText(visualRow, 4, visualRow, 4)).toBe(TEXT);
      });

      it('should clear the covered flags from a cell a column move took out of a merge after the undo and the redo', () => {
        createGrid({
          undo: true,
          trimRows: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        trimRowEight();
        hot.getPlugin('manualColumnMove').moveColumn(5, 8);

        expectNoCoveredFlags(1, 5);

        hot.getPlugin('undoRedo').undo();
        hot.render();

        // The undone merge covers the cell again, and reading its meta stores the flags on it.
        hot.getCellMeta(1, hot.toVisualColumn(5));

        expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);

        hot.getPlugin('undoRedo').redo();

        expectNoCoveredFlags(1, 5);

        hot.setSourceDataAtCell(1, 5, TEXT);

        const visualColumn = hot.toVisualColumn(5);

        expect(hot.getCopyableText(1, visualColumn, 1, visualColumn)).toBe(TEXT);
      });

      it('should keep the covered flags on the cells the merge still covers', () => {
        createGrid({
          trimRows: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        trimRowEight();
        hot.getPlugin('manualColumnMove').moveColumn(0, 1);

        expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);
        expect(hasStoredFlag(1, 5, 'copyable')).toBe(true);
      });
    });

    describe('when a move is undone or redone', () => {
      it('should clear the span keys from the former top-left after the undo and the redo of `moveColumn()`', () => {
        createGrid({ undo: true, manualColumnMove: true });

        hot.getPlugin('manualColumnMove').moveColumn(4, 5);
        hot.getCellMeta(1, 4);

        // Physical column 5 is the first column of the merge now.
        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 5, key)).toBe(true));

        hot.getPlugin('undoRedo').undo();

        expect(hot.toPhysicalColumn(4)).toBe(4);
        expect(hasAnySpanKey(1, 5)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();

        hot.getPlugin('undoRedo').redo();

        expect(hot.toPhysicalColumn(4)).toBe(5);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the covered flags from a cell a column move took out of a merge after the undo and the redo', () => {
        createGrid({
          undo: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        hot.getPlugin('manualColumnMove').moveColumn(5, 8);
        hot.getPlugin('undoRedo').undo();
        hot.render();

        // The undone merge covers the cell again, and reading its meta stores the flags on it.
        hot.getCellMeta(1, 5);

        expect(hasStoredFlag(1, 5, 'hidden')).toBe(true);
        expect(hasStoredFlag(1, 5, 'copyable')).toBe(true);

        hot.getPlugin('undoRedo').redo();

        const visualColumn = hot.toVisualColumn(5);

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.get(1, visualColumn)).toBe(false);
        expect(hasStoredFlag(1, 5, 'hidden')).toBe(false);
        expect(hasStoredFlag(1, 5, 'copyable')).toBe(false);

        hot.setSourceDataAtCell(1, 5, 'released');

        expect(hot.getCopyableText(1, visualColumn, 1, visualColumn)).toBe('released');
      });

      it('should keep the covered flags on the cells the merge still covers after the undo and the redo of `moveColumn()`', () => {
        createGrid({
          undo: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        hot.getPlugin('manualColumnMove').moveColumn(5, 8);
        hot.getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

        // Nothing has read the meta since the redo, so these are the flags the restore left stored. Physical
        // column 6 stays in the merge, and column 5 left it.
        expect(hot.getPlugin('mergeCells').mergedCellsCollection.get(1, hot.toVisualColumn(6))).not.toBe(false);
        expect(hasStoredFlag(1, 6, 'hidden')).toBe(true);
        expect(hasStoredFlag(1, 6, 'copyable')).toBe(true);
        expect(hasStoredFlag(1, 5, 'hidden')).toBe(false);
        expect(hasStoredFlag(1, 4, 'hidden')).toBe(false);
      });

      it('should clear the covered flags from a cell that leaves a merge whose geometry a move did not change', () => {
        createGrid({
          undo: true,
          manualColumnMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
        });

        // Column 8 comes into the merge and pushes physical column 6 out, so the merge keeps its three columns.
        hot.getPlugin('manualColumnMove').moveColumn(8, 6);
        hot.getPlugin('undoRedo').undo();
        hot.render();
        hot.getCellMeta(1, 6);

        expect(hasStoredFlag(1, 6, 'hidden')).toBe(true);

        hot.getPlugin('undoRedo').redo();

        expect(hot.toPhysicalColumn(6)).toBe(8);
        expect(hasStoredFlag(1, 6, 'hidden')).toBe(false);
        expect(hasStoredFlag(1, 6, 'copyable')).toBe(false);
      });

      it('should clear the span keys from the former top-left after the undo and the redo of `moveRow()`', () => {
        createGrid({ undo: true, manualRowMove: true, mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 2 }] });

        hot.getPlugin('manualRowMove').moveRow(1, 6);
        hot.getCellMeta(1, 4);
        hot.getCellMeta(hot.toVisualRow(1), 4);
        hot.getCellMeta(hot.toVisualRow(1), 5);

        hot.getPlugin('undoRedo').undo();

        hot.getCellMeta(1, 4);
        expect(hot.toVisualRow(1)).toBe(1);
        expectSpanKeysOnlyOnTopLefts();

        hot.getPlugin('undoRedo').redo();

        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left after the undo of `moveColumn()` while a row is trimmed', () => {
        createGrid({ undo: true, trimRows: true, manualColumnMove: true });

        trimRowEight();
        hot.getPlugin('manualColumnMove').moveColumn(4, 5);
        hot.getCellMeta(1, 4);

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 5, key)).toBe(true));

        hot.getPlugin('undoRedo').undo();

        expect(hasAnySpanKey(1, 5)).toBe(false);
        expect(hot.getCellMeta(1, 4).rowspan).toBe(3);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left after the redo of `moveColumn()` while a row is trimmed', () => {
        createGrid({ undo: true, trimRows: true, manualColumnMove: true });

        trimRowEight();
        hot.getPlugin('manualColumnMove').moveColumn(4, 5);
        hot.render();
        hot.getPlugin('undoRedo').undo();
        hot.render();

        // The render stored the keys on the restored top-left, which the redo takes the merge off.
        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));

        hot.getPlugin('undoRedo').redo();

        expect(hot.toPhysicalColumn(4)).toBe(5);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should clear the span keys from the former top-left after the undo and the redo of `moveRow()` while a row is trimmed', () => {
        createGrid({
          undo: true,
          trimRows: true,
          manualRowMove: true,
          mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }],
        });

        trimRowEight();
        hot.getPlugin('manualRowMove').moveRow(1, 6);
        hot.render();

        // The 2x1 fragment is drawn from physical (2, 4), and physical row 1 sits alone.
        expectSpanKeysOnlyOnTopLefts();

        hot.getPlugin('undoRedo').undo();
        hot.render();

        expect(hot.toPhysicalRow(1)).toBe(1);
        expect(hasAnySpanKey(2, 4)).toBe(false);
        expectSpanKeysOnlyOnTopLefts();

        hot.getPlugin('undoRedo').redo();

        expect(hot.toPhysicalRow(1)).toBe(2);
        expect(hasAnySpanKey(1, 4)).toBe(false);
        expectSpanKeysOnlyOnTopLefts();
      });

      it('should keep the span keys of a merge a move did not touch after the undo', () => {
        createGrid({ undo: true, manualColumnMove: true });

        hot.getPlugin('manualColumnMove').moveColumn(0, 1);
        hot.getPlugin('undoRedo').undo();

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));
      });
    });

    describe('when the change does not move the cell a merge is drawn from', () => {
      it('should leave the span keys alone after a sort', () => {
        createGrid({ columnSorting: true });

        // Nothing renders in between, so the keys that are checked are the stored ones, not the hook's rewrite.
        hot.suspendRender();
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

        // The merge keeps its head row, so physical (1, 4) is still the cell it is drawn from.
        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));
        expect(hasAnySpanKey(2, 4)).toBe(false);
        expectSpanKeysOnlyOnTopLefts();

        hot.resumeRender();
      });

      it('should keep the span keys of the merge when a row is inserted above it while a row is trimmed', () => {
        createGrid({ trimRows: true });

        hot.getPlugin('trimRows').trimRows([1]);
        hot.render();

        // Row 1 is trimmed, so the merge is drawn from physical row 2, and the inserted row shifts it to 3.
        SPAN_KEYS.forEach(key => expect(hasStoredFlag(2, 4, key)).toBe(true));

        // Nothing renders in between, so the keys that are checked are the stored ones, not the hook's rewrite.
        hot.suspendRender();
        hot.alter('insert_row_above', 0, 1);

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(3, 4, key)).toBe(true));

        hot.resumeRender();
      });

      it('should keep the span keys of the merge when a row is removed above it while a row is trimmed', () => {
        createGrid({ trimRows: true });

        hot.getPlugin('trimRows').trimRows([1]);
        hot.render();

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(2, 4, key)).toBe(true));

        hot.suspendRender();
        hot.alter('remove_row', 0, 1);

        SPAN_KEYS.forEach(key => expect(hasStoredFlag(1, 4, key)).toBe(true));

        hot.resumeRender();
      });
    });
  });
});
