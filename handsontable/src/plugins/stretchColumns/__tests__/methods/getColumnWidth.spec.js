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
      handsontable({
        data: createSpreadsheetData(3, 3),
        width: 200,
        height: 100,
        stretchH: 'all',
      });

      const plugin = getPlugin('stretchColumns');

      expect(plugin.getColumnWidth(0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(67);
        main.toBe(67);
        horizon.toBe(62);
      });
      expect(plugin.getColumnWidth(1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(67);
        main.toBe(67);
        horizon.toBe(62);
      });
      expect(plugin.getColumnWidth(2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(66);
        main.toBe(66);
        horizon.toBe(61);
      });
    });

    it('should return correct column widths when stretching "last" is enabled', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        width: 200,
        height: 100,
        stretchH: 'last',
      });

      const plugin = getPlugin('stretchColumns');

      expect(plugin.getColumnWidth(0)).toBe(null);
      expect(plugin.getColumnWidth(1)).toBe(null);
      expect(plugin.getColumnWidth(2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(100);
        main.toBe(100);
        horizon.toBe(85);
      });
    });
  });
});
