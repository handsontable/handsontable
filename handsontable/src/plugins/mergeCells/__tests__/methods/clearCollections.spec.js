describe('MergeCells', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`clearCollections()` method', () => {
    it('should clear merged cells collection without throw an exception', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 1),
        width: 100,
        height: 100,
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 1 },
          { row: 4, col: 0, rowspan: 30, colspan: 1 },
          { row: 48, col: 0, rowspan: 2, colspan: 1 },
        ],
      });

      expect(() => {
        hot.getPlugin('mergeCells').clearCollections();
      }).not.toThrow();
    });
  });
});
