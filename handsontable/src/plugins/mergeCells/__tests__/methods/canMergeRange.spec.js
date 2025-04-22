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

  describe('`canMergeRange` method', () => {
    it('should return false if coords point to negative values', () => {
      handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });

      const plugin = getPlugin('mergeCells');

      expect(plugin.canMergeRange({ row: -1, col: 1, rowspan: 2, colspan: 2 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: -1, rowspan: 2, colspan: 2 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: -2, colspan: 2 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: 2, colspan: -2 })).toBe(false);
    });

    it('should return false if coords point out of table dataset range', () => {
      handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });

      const plugin = getPlugin('mergeCells');

      expect(plugin.canMergeRange({ row: 50, col: 1, rowspan: 2, colspan: 2 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: 50, rowspan: 2, colspan: 2 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: 50, colspan: 2 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: 2, colspan: 50 })).toBe(false);
    });

    it('should return false if coords point to single cell', () => {
      handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });

      const plugin = getPlugin('mergeCells');

      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: 1, colspan: 1 })).toBe(false);
    });

    it('should return false if coords contain invalid rowspan/colspan', () => {
      handsontable({
        data: createSpreadsheetObjectData(10, 5)
      });

      const plugin = getPlugin('mergeCells');

      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: 0, colspan: 1 })).toBe(false);
      expect(plugin.canMergeRange({ row: 1, col: 1, rowspan: 1, colspan: 0 })).toBe(false);
    });
  });
});
