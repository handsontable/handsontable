describe('ContextMenu', () => {
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

  describe('clearColumn', () => {
    it('should not be possible to use the `clearColumn` option, when anything but entire columns was selected', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        height: 100,
        rowHeaders: true,
        colHeaders: true
      });

      contextMenu();

      const clearColumnTitle = hot.getTranslatedPhrase(
        Handsontable.languages.dictionaryKeys.CONTEXTMENU_ITEMS_CLEAR_COLUMN
      );
      const contextMenuPlugin = hot.getPlugin('contextMenu');
      const getClearColumnItem = () => {
        return $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === clearColumnTitle;
        });
      };

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(true);

      contextMenuPlugin.close();

      hot.selectCell(0, 0);

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(true);

      contextMenuPlugin.close();

      hot.selectCell(0, 0, 2, 2);

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(true);

      contextMenuPlugin.close();

      hot.selectAll();

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(true);

      contextMenuPlugin.close();

      hot.selectColumns(0);

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(false);

      contextMenuPlugin.close();

      hot.selectColumns(0, 1);

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(false);

      contextMenuPlugin.close();
    });

    it('should clear the data in the selected column(s)', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        height: 100,
        rowHeaders: true,
        colHeaders: true
      });

      hot.selectColumns(0);

      contextMenu();

      const contextMenuPlugin = hot.getPlugin('contextMenu');
      const clearColumnTitle = hot.getTranslatedPhrase(
        Handsontable.languages.dictionaryKeys.CONTEXTMENU_ITEMS_CLEAR_COLUMN
      );
      const getClearColumnItem = () => {
        return $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === clearColumnTitle;
        });
      };

      simulateClick(getClearColumnItem());

      contextMenuPlugin.close();

      hot.selectColumns(2, 3);

      contextMenu();

      simulateClick(getClearColumnItem());

      expect(hot.getDataAtCol(0)).toEqual([null, null, null, null]);
      expect(hot.getDataAtCol(1)).toEqual(['B1', 'B2', 'B3', 'B4']);
      expect(hot.getDataAtCol(2)).toEqual([null, null, null, null]);
      expect(hot.getDataAtCol(3)).toEqual([null, null, null, null]);
    });
  });
});
