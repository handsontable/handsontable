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

  describe('insert column left', () => {
    it('should insert column on the left of the clicked column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1, true));

      const item = selectContextMenuOption('Insert column left');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
      expect(`
        |   :   :   :   : * :   ║   |
        |===:===:===:===:===:===:===|
        |   :   :   :   : A :   ║ - |
        |   :   :   :   : 0 :   ║ - |
        |   :   :   :   : 0 :   ║ - |
        |   :   :   :   : 0 :   ║ - |
        |   :   :   :   : 0 :   ║ - |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the left when the menu is triggered by corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column left');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', null]);
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

    it('should insert column on the left when the menu is triggered by corner and all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: [1, 2, 3, 4, 5],
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column left');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getColHeader()).toEqual([1, 2, 3, 4, 5, 'F']);
      expect(`
        | - : - : - : - : - : - ║   |
        |===:===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the left of the clicked cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const item = selectContextMenuOption('Insert column left');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
      expect(`
        |   :   :   :   : - :   ║   |
        |===:===:===:===:===:===:===|
        |   :   :   :   :   :   ║   |
        |   :   :   :   : # :   ║ - |
        |   :   :   :   :   :   ║   |
        |   :   :   :   :   :   ║   |
        |   :   :   :   :   :   ║   |
        `).toBeMatchToSelectionPattern();
    });
  });
});
