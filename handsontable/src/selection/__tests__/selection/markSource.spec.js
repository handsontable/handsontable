describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`markSource` method', () => {
    it('should mark and maintain the source selection until it\'s revoked by the `markEndSource` method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      hot.selection.markSource('test');
      hot.selection.selectAll();

      expect(hot.selection.getSelectionSource()).toBe('test');

      hot.selection.selectRows(1);

      expect(hot.selection.getSelectionSource()).toBe('test');

      hot.selection.selectColumns(1);

      expect(hot.selection.getSelectionSource()).toBe('test');

      hot.selection.selectCells([[0, 0, 3, 0]]);

      expect(hot.selection.getSelectionSource()).toBe('test');

      hot.selection.setRangeStart(cellCoords(1, 1));

      expect(hot.selection.getSelectionSource()).toBe('test');

      hot.selection.setRangeEnd(cellCoords(2, 2));

      expect(hot.selection.getSelectionSource()).toBe('test');

      hot.selection.markEndSource();

      expect(hot.selection.getSelectionSource()).toBe('unknown');
    });
  });
});
