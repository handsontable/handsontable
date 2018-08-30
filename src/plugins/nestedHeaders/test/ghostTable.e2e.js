describe('NestedHeaders', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('GhostTable', () => {
    it('should be initialized and accessible from the plugin', () => {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });
      var ghostTable = hot.getPlugin('nestedHeaders').ghostTable;

      expect(ghostTable).toBeDefined();
    });

    describe('widthsCache', () => {
      it('should contain cached widths after initialization', () => {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });
        var ghostTable = hot.getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.widthsCache.length).toBeGreaterThan(0);
      });
      it('should properly prepare widths cache, even if container is smaller than needed', () => {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(7, 7),
          width: 300,
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd', 'e'],
            ['Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title']
          ]
        });
        var ghostTable = hot.getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.widthsCache[ghostTable.widthsCache.length - 1]).toBeGreaterThan(50);
      });
      it('should container be removed after ', () => {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });
        var ghostTable = hot.getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.container).toBeNull();
      });
    });

    describe('updateSettings', () => {
      it('should recreate the widths cache', () => {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });
        var beforeUpdate = hot.getPlugin('nestedHeaders').ghostTable.widthsCache[1];

        hot.updateSettings({
          nestedHeaders: [
            ['a', 'bbbbbbbbbbbbbbbbb', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        var afterUpdate = hot.getPlugin('nestedHeaders').ghostTable.widthsCache[1];

        expect(afterUpdate).toBeGreaterThan(beforeUpdate);
      });
    });
  });
});
