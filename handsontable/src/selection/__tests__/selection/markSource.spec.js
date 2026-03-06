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
    it('should mark and maintain the source selection until it\'s revoked by the `markEndSource` method', async() => {
      handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      selection().markSource('test');
      selection().selectAll();

      expect(selection().getSelectionSource()).toBe('test');

      selection().selectRows(1);

      expect(selection().getSelectionSource()).toBe('test');

      selection().selectColumns(1);

      expect(selection().getSelectionSource()).toBe('test');

      selection().selectCells([[0, 0, 3, 0]]);

      expect(selection().getSelectionSource()).toBe('test');

      selection().setRangeStart(cellCoords(1, 1));

      expect(selection().getSelectionSource()).toBe('test');

      selection().setRangeEnd(cellCoords(2, 2));

      expect(selection().getSelectionSource()).toBe('test');

      selection().markEndSource();

      expect(selection().getSelectionSource()).toBe('unknown');
    });
  });
});
