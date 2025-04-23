describe('ContextMenu', () => {
  const id = 'testContainer';
  const getHideColumnCMElement = () => $('.htContextMenu tbody td').not('.htSeparator').filter(
    (i, item) => {
      return $(item).text().toLowerCase().includes('hide column');
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

  describe('hide column', () => {
    it('should hide the entry for "Hide column" in the context menu, when the selection doesn\'t contain an' +
      ' entire column (including the header)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
      });

      await selectCell(0, 0);
      await contextMenu();

      const compatibleEntries = getHideColumnCMElement();

      expect(compatibleEntries.size()).toEqual(0);
    });

    it('should NOT hide the entry for "Hide column" in the context menu, when the selection contains an' +
      ' entire column (including the header) or all cells (including all headers)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true
      });

      await selectColumns(0);
      await contextMenu();

      let compatibleEntries = getHideColumnCMElement();

      expect(compatibleEntries.size()).toEqual(1);

      await selectAll(true);
      await contextMenu(getCell(-1, 0));

      compatibleEntries = getHideColumnCMElement();

      expect(compatibleEntries.size()).toEqual(1);
    });
  });
});
