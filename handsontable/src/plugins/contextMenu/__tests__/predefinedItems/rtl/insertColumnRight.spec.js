describe('ContextMenu (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('insert column right', () => {
    it('should insert column on the right of the clicked column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   :   :   : * :   :   ║   |
        |===:===:===:===:===:===:===|
        |   :   :   : A :   :   ║ - |
        |   :   :   : 0 :   :   ║ - |
        |   :   :   : 0 :   :   ║ - |
        |   :   :   : 0 :   :   ║ - |
        |   :   :   : 0 :   :   ║ - |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right when the menu is triggered by corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual([null, 'A1', 'B1', 'C1', 'D1', 'E1']);
      expect(`
        | - : - : - : - : - : - ║   |
        |===:===:===:===:===:===:===|
        | 0 : 0 : 0 : 0 : 0 : A ║ - |
        | 0 : 0 : 0 : 0 : 0 : 0 ║ - |
        | 0 : 0 : 0 : 0 : 0 : 0 ║ - |
        | 0 : 0 : 0 : 0 : 0 : 0 ║ - |
        | 0 : 0 : 0 : 0 : 0 : 0 ║ - |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right when the menu is triggered by corner and all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: [1, 2, 3, 4, 5],
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getColHeader()).toEqual(['A', 1, 2, 3, 4, 5]);
      expect(`
        | - : - : - : - : - : - ║   |
        |===:===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right when the menu is triggered by corner and all columns are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(`
        | - ║   |
        |===:===|
        | A ║ - |
        | 0 ║ - |
        | 0 ║ - |
        | 0 ║ - |
        | 0 ║ - |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right when the menu is triggered by corner and dataset is empty', () => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(`
        | - ║   |
        |===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right of the clicked cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   :   :   : - :   :   ║   |
        |===:===:===:===:===:===:===|
        |   :   :   :   :   :   ║   |
        |   :   :   : # :   :   ║ - |
        |   :   :   :   :   :   ║   |
        |   :   :   :   :   :   ║   |
        |   :   :   :   :   :   ║   |
        `).toBeMatchToSelectionPattern();
    });
  });
});
