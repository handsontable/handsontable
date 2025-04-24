describe('ContextMenu', () => {
  const id = 'testContainer';
  const getShowRowCMElement = () => $('.htContextMenu tbody td').not('.htSeparator').filter(
    (i, item) => {
      return $(item).text().toLowerCase().includes('show row');
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

  describe('show row', () => {
    it('should hide the entry for "Show row" in the context menu, when the selection doesn\'t contain an' +
      ' entire row (including the header)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0]
        },
      });

      await selectCell(1, 0);
      await contextMenu();

      const compatibleEntries = getShowRowCMElement();

      expect(compatibleEntries.size()).toEqual(0);
    });

    it('should NOT hide the entry for "Show row" in the context menu, when the selection contains an' +
      ' entire row (including the header) or all cells (including all headers)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0]
        }
      });

      await selectRows(1);
      await contextMenu();

      let compatibleEntries = getShowRowCMElement();

      expect(compatibleEntries.size()).toEqual(1);

      await selectAll(true);
      await contextMenu(getCell(1, -1));

      compatibleEntries = getShowRowCMElement();

      expect(compatibleEntries.size()).toEqual(1);
    });
  });
});
