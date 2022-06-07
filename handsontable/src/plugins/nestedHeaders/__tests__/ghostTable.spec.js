describe('NestedHeaders', () => {
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

  describe('GhostTable', () => {
    it('should be initialized and accessible from the plugin', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });
      const ghostTable = hot.getPlugin('nestedHeaders').ghostTable;

      expect(ghostTable).toBeDefined();
    });

    describe('widthsCache', () => {
      it('should contain cached widths after initialization', () => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.widthsMap.getLength()).toBe(10);
      });

      it('should properly prepare widths cache, even if container is smaller than needed', () => {
        handsontable({
          data: createSpreadsheetData(7, 7),
          width: 300,
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd', 'e'],
            ['Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title',
              'Very Long Title', 'Very Long Title'],
          ]
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeAroundValue(92);
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeAroundValue(92);
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeAroundValue(92);
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBeAroundValue(92);
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(92);
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBeAroundValue(92);
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBeAroundValue(92);
      });

      it('should properly prepare widths cache, even if container is smaller than needed (different headers configuration #1)', () => {
        handsontable({
          data: createSpreadsheetData(3, 10),
          width: 300,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }, 'C'],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }, 'M'],
            ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
          ],
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeAroundValue(19);
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeAroundValue(19);
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeAroundValue(16);
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBeAroundValue(19);
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(19);
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBeAroundValue(16);
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBeAroundValue(16);
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeAroundValue(88);
        expect(ghostTable.widthsMap.getValueAtIndex(8)).toBeAroundValue(88);
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBeAroundValue(21);
      });

      it('should container be removed after initialization', () => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.container).toBeNull();
      });
    });

    describe('updateSettings', () => {
      it('should recreate the widths cache', () => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });
        const widthBeforeUpdate = getPlugin('nestedHeaders').ghostTable.getWidth(1);

        updateSettings({
          nestedHeaders: [
            ['a', 'bbbbbbbbbbbbbbbbb', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const widthAfterUpdate = getPlugin('nestedHeaders').ghostTable.getWidth(1);

        expect(widthAfterUpdate).not.toBe(widthBeforeUpdate);
        expect(widthAfterUpdate).toBeAroundValue(120);
      });
    });
  });
});
