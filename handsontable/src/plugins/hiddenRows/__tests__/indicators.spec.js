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

  describe('indicators', () => {
    it('should add proper class names in row headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [1, 3],
          indicators: true,
        },
        rowHeaders: true,
      });

      expect(getCell(0, -1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(1, -1)).toBe(null);
      expect(getCell(2, -1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(2, -1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);
      expect(getCell(3, -1)).toBe(null);
      expect(getCell(4, -1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);
    });

    it('should render indicators after enabling them in updateSettings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        hiddenRows: {
          rows: [0, 2],
        },
        rowHeaders: true,
      });

      expect(getCell(1, -1)).not.toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(1, -1)).not.toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);

      updateSettings({
        hiddenRows: {
          rows: [0, 2],
          indicators: true,
        },
      });

      expect(getCell(1, -1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(1, -1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);
    });
  });
});
