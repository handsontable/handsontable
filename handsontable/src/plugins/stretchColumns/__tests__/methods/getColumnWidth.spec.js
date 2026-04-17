describe('StretchColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`getColumnWidth` method', () => {
    it('should return `null` when the stretching is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const plugin = getPlugin('stretchColumns');

      expect(plugin.getColumnWidth(0)).toBe(null);
      expect(plugin.getColumnWidth(1)).toBe(null);
      expect(plugin.getColumnWidth(2)).toBe(null);
    });

    it('should return correct column widths when stretching "all" is enabled', async() => {
      const containerWidth = 200;

      handsontable({
        data: createSpreadsheetData(3, 3),
        width: containerWidth,
        height: containerHeightForRows(3, 0),
        stretchH: 'all',
      });

      const plugin = getPlugin('stretchColumns');
      const expectedFloor = Math.floor(containerWidth / 3);

      expect(plugin.getColumnWidth(0)).toBeAroundValue(expectedFloor, 1);
      expect(plugin.getColumnWidth(1)).toBeAroundValue(expectedFloor, 1);
      expect(plugin.getColumnWidth(2)).toBeAroundValue(expectedFloor, 1);
      expect(plugin.getColumnWidth(0) + plugin.getColumnWidth(1) + plugin.getColumnWidth(2)).toBe(containerWidth);
    });

    it('should return correct column widths when stretching "last" is enabled', async() => {
      const containerWidth = 200;

      handsontable({
        data: createSpreadsheetData(3, 3),
        width: containerWidth,
        height: containerHeightForRows(3, 0),
        stretchH: 'last',
      });

      const plugin = getPlugin('stretchColumns');

      expect(plugin.getColumnWidth(0)).toBe(null);
      expect(plugin.getColumnWidth(1)).toBe(null);
      expect(plugin.getColumnWidth(2)).toBe(containerWidth - 100);
    });
  });
});
