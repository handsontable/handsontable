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
        data: createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        height: 100,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
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

      hot.selectCell(-1, 1);

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(true);

      contextMenuPlugin.close();

      hot.selectCell(1, -1);

      contextMenu();

      expect(getClearColumnItem().hasClass('htDisabled')).toBe(true);

      contextMenuPlugin.close();

      hot.selectCell(-1, -1);

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
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        height: 100,
        rowHeaders: true,
        colHeaders: true
      });

      selectColumns(0);

      contextMenu();
      selectContextMenuOption('Clear column');

      selectColumns(2, 3);

      contextMenu();
      selectContextMenuOption('Clear column');

      expect(getDataAtCol(0)).toEqual([null, null, null, null]);
      expect(getDataAtCol(1)).toEqual(['B1', 'B2', 'B3', 'B4']);
      expect(getDataAtCol(2)).toEqual([null, null, null, null]);
      expect(getDataAtCol(3)).toEqual([null, null, null, null]);
    });

    it('should display entry as enabled, when all rows are non-read-only', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        rowHeaders: true,
        colHeaders: true,
        readOnly: false,
      });

      selectColumns(0);
      contextMenu();

      const item = selectContextMenuOption('Clear column');

      expect(item.hasClass('htDisabled')).toBe(false);
    });

    it('should display a disabled entry, when all rows are read-only', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        rowHeaders: true,
        colHeaders: true,
        readOnly: true,
      });

      selectColumns(0);
      contextMenu();

      const item = selectContextMenuOption('Clear column');

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display non-disabled entry, when one of the rows is non-read-only', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['clear_column'],
        rowHeaders: true,
        colHeaders: true,
        readOnly: true,
      });

      setCellMeta(2, 0, 'readOnly', false);
      selectColumns(0);
      contextMenu();

      const item = selectContextMenuOption('Clear column');

      expect(item.hasClass('htDisabled')).toBe(false);
    });
  });
});
