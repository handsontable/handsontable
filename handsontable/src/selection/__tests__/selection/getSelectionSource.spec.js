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
    it('should return `unknown` by default', async() => {
      handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      selection().selectAll();

      expect(selection().getSelectionSource()).toBe('unknown');

      selection().selectRows(1);

      expect(selection().getSelectionSource()).toBe('unknown');

      selection().selectColumns(1);

      expect(selection().getSelectionSource()).toBe('unknown');

      selection().selectCells([[0, 0, 3, 0]]);

      expect(selection().getSelectionSource()).toBe('unknown');

      selection().setRangeStart(cellCoords(1, 1));

      expect(selection().getSelectionSource()).toBe('unknown');

      selection().setRangeEnd(cellCoords(2, 2));

      expect(selection().getSelectionSource()).toBe('unknown');
    });
  });
});
