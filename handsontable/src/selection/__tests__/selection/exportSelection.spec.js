describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('`exportSelection` method', () => {
    it('should be possible to export a whole selection state (complex selection with columns, rows and changed focus position)', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      await selectRows(2);
      await keyDown('meta');
      await selectColumns(3);
      await mouseDown(getCell(3, 0));
      await mouseOver(getCell(3, 1));
      await mouseOver(getCell(4, 1));
      await mouseUp(getCell(4, 1));
      await keyUp('meta');
      await keyDownUp(['shift', 'tab']); // selects D5

      const selectionState = hot.selection.exportSelection();

      expect(selectionState).toEqual({
        ranges: [
          cellRange(2, -1, 2, 4, 2, 0),
          cellRange(-1, 3, 4, 3, 4, 3),
          cellRange(3, 0, 4, 1, 3, 0),
        ],
        activeRange: cellRange(-1, 3, 4, 3, 4, 3),
        activeSelectionLayer: 1,
        selectedByRowHeader: [0],
        selectedByColumnHeader: [1],
        disableHeadersHighlight: false,
      });
    });

    it('should be possible to export a whole selection state (selected all cells by corner click)', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      await selectAll(true, true, {
        disableHeadersHighlight: true,
      });

      const selectionState = hot.selection.exportSelection();

      expect(selectionState).toEqual({
        ranges: [cellRange(-1, -1, 4, 4, 0, 0)],
        activeRange: cellRange(-1, -1, 4, 4, 0, 0),
        activeSelectionLayer: 0,
        selectedByRowHeader: [0],
        selectedByColumnHeader: [0],
        disableHeadersHighlight: true,
      });
    });

    it('should export an object with empty ranges when there is no selection', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      const selectionState = hot.selection.exportSelection();

      expect(selectionState).toEqual({
        ranges: [],
        activeRange: undefined,
        activeSelectionLayer: 0,
        selectedByRowHeader: [],
        selectedByColumnHeader: [],
        disableHeadersHighlight: false,
      });
    });
  });
});
