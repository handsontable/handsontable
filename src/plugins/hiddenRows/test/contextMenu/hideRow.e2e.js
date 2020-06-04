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

  describe('hide row', () => {
    it('should hide the entry for "Hide row" in the context menu, when the selection doesn\'t contain an' +
      ' entire row (including the header)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
      });

      selectCell(0, 0);
      contextMenu();

      const contextMenuPlugin = getPlugin('contextMenu');
      const hiddenRowsCMEntry = contextMenuPlugin.menu.menuItems.filter((el) => {
        return el.key === 'hidden_rows_hide';
      })[0];

      expect(hiddenRowsCMEntry.hidden.call(hot())).toEqual(true);
    });

    it('should NOT hide the entry for "Hide row" in the context menu, when the selection contains an' +
      ' entire row (including the header) or all cells (including all headers)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true
      });

      selectRows(0);
      contextMenu();

      const contextMenuPlugin = getPlugin('contextMenu');
      const hiddenRowsCMEntry = contextMenuPlugin.menu.menuItems.filter((el) => {
        return el.key === 'hidden_rows_hide';
      })[0];

      expect(hiddenRowsCMEntry.hidden.call(hot())).toEqual(false);

      selectAll(true);
      contextMenu(getCell(0, -1));

      expect(hiddenRowsCMEntry.hidden.call(hot())).toEqual(false);
    });
  });
});
