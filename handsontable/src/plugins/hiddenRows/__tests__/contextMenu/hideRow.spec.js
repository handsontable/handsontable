describe('ContextMenu', () => {
  const id = 'testContainer';
  const getHideRowCMElement = () => $('.htContextMenu tbody td').not('.htSeparator').filter(
    (i, item) => {
      return $(item).text().toLowerCase().includes('hide row');
    }
  );

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
      ' entire row (including the header)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
      });

      await selectCell(0, 0);
      await contextMenu();

      const compatibleEntries = getHideRowCMElement();

      expect(compatibleEntries.size()).toEqual(0);
    });

    it('should NOT hide the entry for "Hide row" in the context menu, when the selection contains an' +
      ' entire row (including the header) or all cells (including all headers)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true
      });

      await selectRows(0);
      await contextMenu();

      let compatibleEntries = getHideRowCMElement();

      expect(compatibleEntries.size()).toEqual(1);

      await selectAll(true);
      await contextMenu(getCell(0, -1));

      compatibleEntries = getHideRowCMElement();

      expect(compatibleEntries.size()).toEqual(1);
    });
  });
});
