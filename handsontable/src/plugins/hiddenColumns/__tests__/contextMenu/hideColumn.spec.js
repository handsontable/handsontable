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
      ' entire column (including the header)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
      });

      selectCell(0, 0);
      contextMenu();

      const compatibleEntries = getHideColumnCMElement();

      expect(compatibleEntries.size()).toEqual(0);
    });

    it('should NOT hide the entry for "Hide column" in the context menu, when the selection contains an' +
      ' entire column (including the header) or all cells (including all headers)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true
      });

      selectColumns(0);
      contextMenu();

      let compatibleEntries = getHideColumnCMElement();

      expect(compatibleEntries.size()).toEqual(1);

      selectAll(true);
      contextMenu(getCell(-1, 0));

      compatibleEntries = getHideColumnCMElement();

      expect(compatibleEntries.size()).toEqual(1);
    });
  });
});
