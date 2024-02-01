describe('settings', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('displayValue', () => {
    it('should be `undefined` for every cell by default', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      getData().forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          expect(getCellMeta(rowIndex, colIndex).displayValue).toBeUndefined();
        });
      });
    });
  });
});
