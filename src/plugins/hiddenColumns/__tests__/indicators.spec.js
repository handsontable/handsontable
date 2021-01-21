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

  describe('indicators', () => {
    it('should add proper class names in column headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [1, 3],
          indicators: true,
        },
        colHeaders: true,
      });

      expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
    });

    it('should render indicators after enabling them in updateSettings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
        hiddenColumns: {
          columns: [0, 2],
        },
        colHeaders: true,
      });

      expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);

      updateSettings({
        hiddenColumns: {
          columns: [0, 2],
          indicators: true,
        },
      });

      expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
    });
  });
});
