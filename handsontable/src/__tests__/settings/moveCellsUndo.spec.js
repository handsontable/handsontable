describe('settings', () => {
  describe('moveCells undo/redo', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('undo restores source + overwritten target; redo re-applies (move)', async() => {
      handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, undo: true });
      const src = getDataAtCell(2, 2);
      const dstBefore = getDataAtCell(5, 5);

      await selectCells([[2, 2, 3, 3]]);
      await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
      await hot().render();

      expect(getDataAtCell(5, 5)).toBe(src);
      expect(getDataAtCell(2, 2)).toBe(null);

      getPlugin('undoRedo').undo();
      await hot().render();

      expect(getDataAtCell(2, 2)).toBe(src); // source restored
      expect(getDataAtCell(5, 5)).toBe(dstBefore); // overwritten target restored

      getPlugin('undoRedo').redo();
      await hot().render();

      expect(getDataAtCell(5, 5)).toBe(src);
      expect(getDataAtCell(2, 2)).toBe(null);
    });

    it('undo of a copy removes the target data and keeps the source', async() => {
      handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, undo: true });
      const src = getDataAtCell(2, 2);
      const dstBefore = getDataAtCell(5, 5);

      await selectCells([[2, 2, 3, 3]]);
      await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), true); // copy
      await hot().render();

      expect(getDataAtCell(2, 2)).toBe(src); // source kept (copy)
      expect(getDataAtCell(5, 5)).toBe(src); // target copied

      getPlugin('undoRedo').undo();
      await hot().render();

      expect(getDataAtCell(2, 2)).toBe(src); // source still there (was not modified)
      expect(getDataAtCell(5, 5)).toBe(dstBefore); // target restored to original
    });

    it('undo/redo of a multi-cell range move works', async() => {
      handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, undo: true });
      const topLeft = getDataAtCell(0, 0);
      const bottomRight = getDataAtCell(1, 1);
      const dstTopLeft = getDataAtCell(5, 5);
      const dstBottomRight = getDataAtCell(6, 6);

      await selectCells([[0, 0, 1, 1]]);
      await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
      await hot().render();

      expect(getDataAtCell(5, 5)).toBe(topLeft);
      expect(getDataAtCell(6, 6)).toBe(bottomRight);
      expect(getDataAtCell(0, 0)).toBe(null);
      expect(getDataAtCell(1, 1)).toBe(null);

      getPlugin('undoRedo').undo();
      await hot().render();

      expect(getDataAtCell(0, 0)).toBe(topLeft);
      expect(getDataAtCell(1, 1)).toBe(bottomRight);
      expect(getDataAtCell(5, 5)).toBe(dstTopLeft);
      expect(getDataAtCell(6, 6)).toBe(dstBottomRight);

      getPlugin('undoRedo').redo();
      await hot().render();

      expect(getDataAtCell(5, 5)).toBe(topLeft);
      expect(getDataAtCell(6, 6)).toBe(bottomRight);
      expect(getDataAtCell(0, 0)).toBe(null);
      expect(getDataAtCell(1, 1)).toBe(null);
    });

    it('undo restores className meta for both source and target', async() => {
      handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, undo: true });
      await setCellMeta(2, 2, 'className', 'my-cell');
      await setCellMeta(5, 5, 'className', 'target-cell');
      await render();

      await selectCells([[2, 2, 2, 2]]);
      await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
      await hot().render();

      expect(getCellMeta(5, 5).className).toBe('my-cell'); // moved
      expect(getCellMeta(2, 2).className).not.toBe('my-cell'); // cleared

      getPlugin('undoRedo').undo();
      await hot().render();

      expect(getCellMeta(2, 2).className).toBe('my-cell'); // source meta restored
      expect(getCellMeta(5, 5).className).toBe('target-cell'); // target meta restored
    });

    it('redo after undo ends up in the moved state', async() => {
      handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, undo: true });
      const src = getDataAtCell(2, 2);

      await selectCells([[2, 2, 3, 3]]);
      await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
      await hot().render();

      // undo, then redo — should end up at the moved state
      getPlugin('undoRedo').undo();
      await hot().render();
      getPlugin('undoRedo').redo();
      await hot().render();

      expect(getDataAtCell(5, 5)).toBe(src);
      expect(getDataAtCell(2, 2)).toBe(null);
    });

    it('does not register a new undo action when moveCellRange is called during redo', async() => {
      handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, undo: true });

      await selectCells([[2, 2, 3, 3]]);
      await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
      await hot().render();

      const undoCountBefore = getPlugin('undoRedo').doneActions.length;

      expect(undoCountBefore).toBe(1);

      getPlugin('undoRedo').undo();
      await hot().render();
      getPlugin('undoRedo').redo();
      await hot().render();

      // After undo+redo the doneActions count should be back to the same as after the original move.
      expect(getPlugin('undoRedo').doneActions.length).toBe(undoCountBefore);
    });
  });
});
