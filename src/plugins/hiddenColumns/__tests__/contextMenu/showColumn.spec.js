describe('ContextMenu', () => {
  const id = 'testContainer';
  const SHOW_COLUMNS_CM_ID = 'hidden_columns_show';
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

    it('should show the entry for "Show column" if the last column is hidden and columns\' array ' +
       'is shorter than a number of datarow\'s keys', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(1, 3),
        colHeaders: true,
        contextMenu: [SHOW_COLUMNS_CM_ID],
        hiddenColumns: {
          columns: [1],
        },
        columns: [{}, {}],
      });

      const { CONTEXTMENU_ITEMS_SHOW_COLUMN } = Handsontable.languages.dictionaryKeys;
      const expectedText = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_COLUMN);

      contextMenu(getCell(-1, 0));

      expect($('.htContextMenu tbody td').text()).toBe(expectedText);
    });

    it('should show the entry for "Show column" if all columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: [SHOW_COLUMNS_CM_ID],
        hiddenColumns: {
          columns: [0, 1, 2],
        },
      });

      const { CONTEXTMENU_ITEMS_SHOW_COLUMN } = Handsontable.languages.dictionaryKeys;
      const expectedText = Handsontable.languages.getTranslatedPhrase('en-US', CONTEXTMENU_ITEMS_SHOW_COLUMN, 1);

      contextMenu(getCell(-1, -1));

      expect($('.htContextMenu tbody td').text()).toBe(expectedText);
    });
  });
});
