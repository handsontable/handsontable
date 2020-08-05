describe('ContextMenu', () => {
  const id = 'testContainer';
  const getShowColumnCMElement = () => $('.htContextMenu tbody td').not('.htSeparator').filter(
    (i, item) => {
      return $(item).text().toLowerCase().includes('show column');
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

  describe('show column', () => {
    it('should hide the entry for "Show column" in the context menu, when the selection doesn\'t contain an' +
      ' entire column (including the header)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0]
        },
      });

      selectCell(0, 1);
      contextMenu();

      const compatibleEntries = getShowColumnCMElement();

      expect(compatibleEntries.size()).toEqual(0);
    });

    it('should NOT hide the entry for "Show column" in the context menu, when the selection contains an' +
      ' entire column (including the header) or all cells (including all headers)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0]
        }
      });

      selectColumns(1);
      contextMenu();

      let compatibleEntries = getShowColumnCMElement();

      expect(compatibleEntries.size()).toEqual(1);

      selectAll(true);
      contextMenu(getCell(-1, 1));

      compatibleEntries = getShowColumnCMElement();

      expect(compatibleEntries.size()).toEqual(1);
    });
  });
});
