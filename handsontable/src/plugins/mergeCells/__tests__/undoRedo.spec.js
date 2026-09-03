describe('MergeCells -> Undo/Redo', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not be possible to remove initially declared merged cells by calling the \'Undo\' action.', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: [
        { row: 5, col: 4, rowspan: 2, colspan: 5 },
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
      ]
    });

    getPlugin('undoRedo').undo();

    expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(2);
  });

  it('should be possible undo the merging process by calling the \'Undo\' action.', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: true
    });

    const plugin = getPlugin('mergeCells');

    plugin.merge(0, 0, 3, 3);
    await selectCell(4, 4, 7, 7);
    plugin.mergeSelection();

    expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(2);
    getPlugin('undoRedo').undo();
    expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    getPlugin('undoRedo').undo();
    expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(0);
  });

  it('should be possible redo the merging process by calling the \'Redo\' action.', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: true
    });

    const plugin = getPlugin('mergeCells');

    plugin.merge(0, 0, 3, 3);
    await selectCell(4, 4, 7, 7);
    plugin.mergeSelection();

    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    getPlugin('undoRedo').redo();
    expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    getPlugin('undoRedo').redo();
    expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(2);
  });

  describe('row removal', () => {
    it('should restore a merged cell that was fully contained in a removed row (single-row merge), and remove it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: [
          { row: 2, col: 1, rowspan: 1, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);

      await alter('remove_row', 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(2);
      expect(restored.col).toBe(1);
      expect(restored.rowspan).toBe(1);
      expect(restored.colspan).toBe(3);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(countRows()).toBe(4);
    });

    it('should restore a multi-row merged cell that was fully contained in removed rows, and remove it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(6, 5),
        mergeCells: [
          { row: 2, col: 0, rowspan: 2, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 2, 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(2);
      expect(restored.col).toBe(0);
      expect(restored.rowspan).toBe(2);
      expect(restored.colspan).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(countRows()).toBe(4);
    });

    it('should preserve a partially-overlapping merged cell across remove + undo (middle row), and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(6, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(4);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(0);
      expect(restored.rowspan).toBe(5);
      expect(restored.colspan).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(4);
    });

    it('should restore a merged cell after removing only its top row (partial top overlap), and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: [
          { row: 3, col: 4, rowspan: 2, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 3);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(3);
      expect(restored.col).toBe(4);
      expect(restored.rowspan).toBe(2);
      expect(restored.colspan).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(1);
    });

    it('should restore a merged cell after removing only its bottom row (partial bottom overlap), and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: [
          { row: 2, col: 1, rowspan: 2, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 3);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(2);
      expect(restored.col).toBe(1);
      expect(restored.rowspan).toBe(2);
      expect(restored.colspan).toBe(3);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(1);
    });

    it('should restore multiple fully-removed merged cells from a single row removal, and remove them again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        mergeCells: [
          { row: 2, col: 0, rowspan: 1, colspan: 2 },
          { row: 2, col: 3, rowspan: 1, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
    });

    it('should restore a merged cell that fully encloses the removed row range, and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(10, 4),
        mergeCells: [
          { row: 0, col: 0, rowspan: 10, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 3, 3);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(7);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(0);
      expect(restored.rowspan).toBe(10);
      expect(restored.colspan).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(7);
    });

    it('should restore a mix of fully-removed and partially-overlapping merges from a single multi-row removal, and re-apply removal on redo', async() => {
      handsontable({
        data: createSpreadsheetData(8, 6),
        mergeCells: [
          { row: 2, col: 0, rowspan: 1, colspan: 2 },
          { row: 1, col: 3, rowspan: 4, colspan: 2 },
          { row: 6, col: 4, rowspan: 1, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 2, 2);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(3);

      const sorted = plugin.mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }))
        .sort((a, b) => a.row - b.row || a.col - b.col);

      expect(sorted).toEqual([
        { row: 1, col: 3, rowspan: 4, colspan: 2 },
        { row: 2, col: 0, rowspan: 1, colspan: 2 },
        { row: 6, col: 4, rowspan: 1, colspan: 2 },
      ]);

      getPlugin('undoRedo').redo();

      const sortedAfterRedo = plugin.mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }))
        .sort((a, b) => a.row - b.row || a.col - b.col);

      expect(sortedAfterRedo).toEqual([
        { row: 1, col: 3, rowspan: 2, colspan: 2 },
        { row: 4, col: 4, rowspan: 1, colspan: 2 },
      ]);
    });

    it('should restore two partially-overlapping merges that share the removed row, and shrink them again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: [
          { row: 1, col: 0, rowspan: 3, colspan: 2 },
          { row: 1, col: 3, rowspan: 3, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 2);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(2);

      const sorted = plugin.mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }))
        .sort((a, b) => a.col - b.col);

      expect(sorted).toEqual([
        { row: 1, col: 0, rowspan: 3, colspan: 2 },
        { row: 1, col: 3, rowspan: 3, colspan: 2 },
      ]);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(2);
      plugin.mergedCellsCollection.mergedCells.forEach((merge) => {
        expect(merge.rowspan).toBe(2);
      });
    });

    it('should remain consistent across repeated undo/redo cycles', async() => {
      handsontable({
        data: createSpreadsheetData(6, 5),
        mergeCells: [
          { row: 2, col: 1, rowspan: 1, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_row', 2);

      for (let cycle = 0; cycle < 3; cycle++) {
        getPlugin('undoRedo').undo();
        expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
        expect(plugin.mergedCellsCollection.mergedCells[0].rowspan).toBe(1);
        expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(3);

        getPlugin('undoRedo').redo();
        expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      }
    });

    it('should preserve cell data inside and around the restored merged area, and re-remove the row on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: [
          { row: 2, col: 1, rowspan: 1, colspan: 3 },
        ],
      });

      const beforeRemoveTopLeft = getDataAtCell(2, 1);
      const beforeRemoveHidden = getDataAtCell(2, 2);

      await alter('remove_row', 2);
      getPlugin('undoRedo').undo();

      expect(getDataAtCell(2, 0)).toBe('A3');
      expect(getDataAtCell(2, 1)).toBe(beforeRemoveTopLeft);
      expect(getDataAtCell(2, 2)).toBe(beforeRemoveHidden);
      expect(getDataAtCell(2, 4)).toBe('E3');

      getPlugin('undoRedo').redo();

      expect(countRows()).toBe(4);
      expect(getDataAtCell(2, 0)).toBe('A4');
      expect(getDataAtCell(2, 4)).toBe('E4');
    });

    it('should restore `spanned` and `hidden` cell metas on the merged area after undo, and clear them again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: [
          { row: 2, col: 1, rowspan: 1, colspan: 3 },
        ],
      });

      await alter('remove_row', 2);
      getPlugin('undoRedo').undo();

      expect(getCellMeta(2, 1).spanned).toBe(true);
      expect(getCellMeta(2, 2).hidden).toBe(true);
      expect(getCellMeta(2, 3).hidden).toBe(true);

      getPlugin('undoRedo').redo();

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toBe(0);
    });

    it('should not throw when removing rows while mergeCells plugin is disabled, and undo + redo should not affect merges', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: false,
      });

      await alter('remove_row', 2);

      expect(() => getPlugin('undoRedo').undo()).not.toThrow();
      expect(countRows()).toBe(5);
      expect(getDataAtCell(2, 0)).toBe('A3');

      expect(() => getPlugin('undoRedo').redo()).not.toThrow();
      expect(countRows()).toBe(4);
    });
  });

  describe('column removal', () => {
    it('should restore a merged cell that was fully contained in a removed column (single-col merge), and remove it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: [
          { row: 1, col: 2, rowspan: 3, colspan: 1 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);

      await alter('remove_col', 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(1);
      expect(restored.col).toBe(2);
      expect(restored.rowspan).toBe(3);
      expect(restored.colspan).toBe(1);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(countCols()).toBe(4);
    });

    it('should restore a multi-column merged cell that was fully contained in removed columns, and remove it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        mergeCells: [
          { row: 0, col: 2, rowspan: 2, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_col', 2, 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(2);
      expect(restored.rowspan).toBe(2);
      expect(restored.colspan).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(countCols()).toBe(4);
    });

    it('should preserve a partially-overlapping merged cell across remove + undo (middle column), and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 5 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_col', 2);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(4);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(0);
      expect(restored.rowspan).toBe(2);
      expect(restored.colspan).toBe(5);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(4);
    });

    it('should restore a merged cell after removing only its leftmost column (partial left overlap), and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        mergeCells: [
          { row: 0, col: 2, rowspan: 2, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_col', 2);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(2);
      expect(restored.colspan).toBe(3);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].col).toBe(2);
      expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(2);
    });

    it('should restore a merged cell after removing only its rightmost column (partial right overlap), and shrink it again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        mergeCells: [
          { row: 0, col: 1, rowspan: 2, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_col', 3);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(1);
      expect(restored.colspan).toBe(3);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(2);
    });

    it('should restore multiple merged cells after a multi-column removal overlapping all of them', async() => {
      handsontable({
        data: createSpreadsheetData(5, 8),
        mergeCells: [
          { row: 0, col: 1, rowspan: 1, colspan: 2 },
          { row: 2, col: 3, rowspan: 1, colspan: 2 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_col', 1, 4);

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

      getPlugin('undoRedo').undo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(2);

      getPlugin('undoRedo').redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
    });

    it('should survive repeated undo/redo cycles for column removal with merged cells', async() => {
      handsontable({
        data: createSpreadsheetData(4, 5),
        mergeCells: [
          { row: 0, col: 1, rowspan: 2, colspan: 3 },
        ],
      });

      const plugin = getPlugin('mergeCells');

      await alter('remove_col', 2);

      for (let i = 0; i < 3; i++) {
        getPlugin('undoRedo').undo();
        expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
        expect(plugin.mergedCellsCollection.mergedCells[0].col).toBe(1);
        expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(3);

        getPlugin('undoRedo').redo();
        expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
        expect(plugin.mergedCellsCollection.mergedCells[0].colspan).toBe(2);
      }
    });

    it('should restore cell data alongside the merged cell after undo', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        mergeCells: [
          { row: 0, col: 1, rowspan: 1, colspan: 3 },
        ],
      });

      await alter('remove_col', 2);

      getPlugin('undoRedo').undo();

      // Only the top-left cell of a merge contains data; hidden cells return null.
      expect(getDataAtCell(0, 1)).toBe('B1');
      expect(getDataAtCell(1, 2)).toBe('C2');
      expect(getDataAtCell(2, 3)).toBe('D3');

      const plugin = getPlugin('mergeCells');
      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(0);
      expect(restored.col).toBe(1);
      expect(restored.colspan).toBe(3);
    });

    it('should not throw when removing columns while mergeCells plugin is disabled, and undo + redo should not affect merges', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: false,
      });

      await alter('remove_col', 2);

      expect(() => getPlugin('undoRedo').undo()).not.toThrow();
      expect(countCols()).toBe(5);

      expect(() => getPlugin('undoRedo').redo()).not.toThrow();
      expect(countCols()).toBe(4);
    });
  });

  describe('paste over a merged cell', () => {
    // A validator moves `applyChanges` into a microtask, so a paste, undo or redo is not finished
    // when the call returns. Wait for the change to be applied AND for the merge geometry to have
    // been restored or dropped: `DataChangeAction` does that inside its own `addHookOnce`
    // ('afterChange') at the default index, so this listener sits behind it at a higher one.
    function settled() {
      return new Promise((resolve) => {
        hot().addHookOnce('afterChange', resolve, 2000);
      });
    }

    // The 2018 reporter's own `afterCopy`/`afterPaste` workaround failed on exactly this
    // ("It works well, except `undo` event"): the merge geometry has to ride inside the paste's own
    // undo action, or one Ctrl+V needs two Ctrl+Z and the intermediate state is the original bug.
    //
    // This is also the guard for the hook ordering the capture depends on: the MergeCells plugin
    // records the geometry from `beforeChange` at the default priority, and the UndoRedo plugin
    // reads it from its own `beforeChange` listener registered at priority 1000 so it runs last.
    // Swap that order and the snapshot is empty here, so the undo below restores no merge.
    it('should restore both the pasted data and the merged cell in a single undo step', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      const plugin = getPlugin('mergeCells');
      const undoRedo = getPlugin('undoRedo');

      await selectCell(5, 6);

      triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(undoRedo.doneActions.length).toBe(1);

      undoRedo.undo();

      // One action, so one undo puts back the geometry AND the data.
      expect(undoRedo.doneActions.length).toBe(0);
      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);

      const restored = plugin.mergedCellsCollection.mergedCells[0];

      expect(restored.row).toBe(5);
      expect(restored.col).toBe(6);
      expect(restored.rowspan).toBe(3);
      expect(restored.colspan).toBe(3);

      expect(getData(5, 6, 7, 8)).toEqual([
        ['G6', null, null],
        [null, null, null],
        [null, null, null],
      ]);
      expect(getCellMeta(5, 7).hidden).toBe(true);
      expect(getCellMeta(7, 8).hidden).toBe(true);
    });

    it('should re-apply the data and drop the merged cell again on redo', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      const plugin = getPlugin('mergeCells');
      const undoRedo = getPlugin('undoRedo');

      await selectCell(5, 6);

      triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');

      undoRedo.undo();
      undoRedo.redo();

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(getData(5, 6, 7, 8)).toEqual([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ]);
      expect(getCellMeta(5, 7).hidden).toBeFalsy();
    });

    // The validated-column ordering again: the paste's `afterChange` lands in a microtask, so the
    // recorded geometry has to survive `afterPaste`. Without that, the paste never unmerges while
    // the action still records the geometry, and redo then drops a merge the paste never dropped -
    // redo produces a different grid than the paste it repeats.
    it('should round-trip paste, undo and redo on a validated column', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        validator: (value, callback) => callback(true),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      const plugin = getPlugin('mergeCells');
      const undoRedo = getPlugin('undoRedo');

      await selectCell(5, 6);

      let done = settled();

      triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');
      await done;

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(getDataAtCell(7, 8)).toBe('i');

      done = settled();
      undoRedo.undo();
      await done;

      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
      expect(getDataAtCell(5, 6)).toBe('G6');

      done = settled();
      undoRedo.redo();
      await done;

      // Redo has to reproduce the paste exactly, geometry included.
      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);
      expect(getData(5, 6, 7, 8)).toEqual([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ]);
    });

    it('should restore only the value when a single pasted value left the merged cell intact', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 6, rowspan: 3, colspan: 3 }, // G6:I8
        ],
      });

      const plugin = getPlugin('mergeCells');
      const undoRedo = getPlugin('undoRedo');

      await selectCell(5, 6);

      triggerPaste('ZZ');

      expect(getDataAtCell(5, 6)).toBe('ZZ');
      // Only the merge's top-left cell was written, so the action carries a single change.
      expect(undoRedo.doneActions.length).toBe(1);
      expect(undoRedo.doneActions[0].changes.length).toBe(1);

      undoRedo.undo();

      expect(getDataAtCell(5, 6)).toBe('G6');
      expect(plugin.mergedCellsCollection.mergedCells.length).toBe(1);
    });
  });
});
