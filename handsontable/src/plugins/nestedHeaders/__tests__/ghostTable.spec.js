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
    it('should be initialized and accessible from the plugin', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });
      const ghostTable = getPlugin('nestedHeaders').ghostTable;

      expect(ghostTable).toBeDefined();
    });

    describe('widthsCache', () => {
      it('should contain cached widths after initialization', async() => {
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

      it('should properly prepare widths cache, even if container is smaller than needed', async() => {
        if (getLoadedTheme() !== 'main') {
          pending();

          return;
        }

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
        const themeLayout = getThemeLayout();

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeAroundValue(
          110,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeAroundValue(
          110,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeAroundValue(
          110,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBeAroundValue(
          110,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(
          110,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBeAroundValue(
          110,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBeAroundValue(
          110,
        );
      });

      it('should properly prepare widths cache, even if container is smaller than needed (different headers configuration #1)', async() => {
        if (getLoadedTheme() !== 'main') {
          pending();

          return;
        }

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
        const themeLayout = getThemeLayout();

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeAroundValue(
          28,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeAroundValue(
          28,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBeAroundValue(
          27,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(
          27,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeAroundValue(
          111,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(8)).toBeAroundValue(
          108,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBeAroundValue(
          30,
        );
      });

      it('should container be removed after initialization', async() => {
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
      it('should recreate the widths cache', async() => {
        if (getLoadedTheme() !== 'main') {
          pending();

          return;
        }

        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });
        const widthBeforeUpdate = getPlugin('nestedHeaders').ghostTable.getWidth(1);

        await updateSettings({
          nestedHeaders: [
            ['a', 'bbbbbbbbbbbbbbbbb', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const widthAfterUpdate = getPlugin('nestedHeaders').ghostTable.getWidth(1);

        expect(widthAfterUpdate).not.toBe(widthBeforeUpdate);
        expect(widthAfterUpdate).toBeAroundValue(
          150,
        );
      });
    });

    describe('with hidden columns', () => {
      it('should calculate the columns widths when some columns are hidden on table initialization', async() => {
        if (getLoadedTheme() !== 'main') {
          pending();

          return;
        }

        handsontable({
          data: createSpreadsheetData(3, 10),
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }],
            ['N', 'O', 'Longer text', 'Longer text', 'R', 'S', 'T', 'U', 'V'],
          ],
          hiddenColumns: {
            columns: [0, 2]
          }
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;
        const themeLayout = getThemeLayout();

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeAroundValue(
          28,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBeAroundValue(
          88,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(
          27,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeAroundValue(
          111,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(8)).toBeAroundValue(
          108,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBe(null);
      });

      it('should recalculate the columns widths after hiding columns', async() => {
        if (getLoadedTheme() !== 'main') {
          pending();

          return;
        }

        handsontable({
          data: createSpreadsheetData(3, 10),
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }],
            ['N', 'O', 'Longer text', 'Longer text', 'R', 'S', 'T', 'U', 'V'],
          ],
          hiddenColumns: true,
        });

        getPlugin('hiddenColumns').hideColumns([1, 3, 7]);
        await render();

        const ghostTable = getPlugin('nestedHeaders').ghostTable;
        const themeLayout = getThemeLayout();

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeAroundValue(
          28,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeAroundValue(
          88,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(
          27,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBeAroundValue(
          26,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(8)).toBeAroundValue(
          219,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBe(null);
      });

      it('should recalculate the columns widths after showing columns', async() => {
        if (getLoadedTheme() !== 'main') {
          pending();

          return;
        }

        handsontable({
          data: createSpreadsheetData(3, 10),
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }],
            ['N', 'O', 'Longer text', 'Longer text', 'R', 'S', 'T', 'U', 'V'],
          ],
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        });

        getPlugin('hiddenColumns').showColumns([2, 4, 7, 8]);
        await render();

        const ghostTable = getPlugin('nestedHeaders').ghostTable;
        const themeLayout = getThemeLayout();

        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeAroundValue(
          88,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(4)).toBeAroundValue(
          28,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(5)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(6)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeAroundValue(
          111,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(8)).toBeAroundValue(
          108,
        );
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBe(null);
      });
    });

  });
});
