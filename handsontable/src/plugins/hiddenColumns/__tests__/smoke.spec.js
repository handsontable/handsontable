describe('HiddenColumns', () => {
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
    it('should not throw an error when first 10k columns are hidden on table initialization', () => {
      expect(() => {
        handsontable({
          data: createSpreadsheetData(5, 10000),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [...Array(10000).keys()],
          },
        });
      }).not.toThrow();
    });

    it('should not throw an error when first 10k columns are hidden and the row header is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 10001),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [...Array(10000).keys()],
        },
      });

      expect(() => {
        selectRows(1);
      }).not.toThrow();

      expect(getSelected()).toEqual([[1, -1, 1, 10000]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(10000);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(-1);
      expect(getSelectedRangeLast().to.row).toBe(1);
      expect(getSelectedRangeLast().to.col).toBe(10000);
      expect(`
        |   ║ - |
        |===:===|
        |   ║   |
        | * ║ A |
        |   ║   |
        |   ║   |
        |   ║   |
      `).toBeMatchToSelectionPattern();
    });
  });
});
