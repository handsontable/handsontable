describe('HiddenRows', () => {
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

  describe('smoke test', () => {
    it('should not throw an error when first 10k rows are hidden on table initialization', () => {
      expect(() => {
        handsontable({
          data: createSpreadsheetData(10000, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [...Array(10000).keys()],
          },
        });
      }).not.toThrow();
    });

    it('should not throw an error when first 10k rows are hidden and the column header is selected', () => {
      handsontable({
        data: createSpreadsheetData(10001, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [...Array(10000).keys()],
        },
      });

      expect(() => {
        selectColumns(1);
      }).not.toThrow();

      expect(getSelected()).toEqual([[-1, 1, 10000, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(10000);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(-1);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(10000);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect(`
        |   ║   : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : A :   :   :   |
      `).toBeMatchToSelectionPattern();
    });
  });
});
