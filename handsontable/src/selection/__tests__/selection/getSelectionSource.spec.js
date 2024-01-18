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

  describe('`getSelectionSource` method', () => {
    it('should return `unknown` by default', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      hot.selection.selectAll();

      expect(hot.selection.getSelectionSource()).toBe('unknown');

      hot.selection.selectRows(1);

      expect(hot.selection.getSelectionSource()).toBe('unknown');

      hot.selection.selectColumns(1);

      expect(hot.selection.getSelectionSource()).toBe('unknown');

      hot.selection.selectCells([[0, 0, 3, 0]]);

      expect(hot.selection.getSelectionSource()).toBe('unknown');

      hot.selection.setRangeStart(cellCoords(1, 1));

      expect(hot.selection.getSelectionSource()).toBe('unknown');

      hot.selection.setRangeEnd(cellCoords(2, 2));

      expect(hot.selection.getSelectionSource()).toBe('unknown');
    });
  });
});
