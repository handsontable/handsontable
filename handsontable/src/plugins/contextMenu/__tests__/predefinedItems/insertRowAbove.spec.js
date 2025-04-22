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

  describe('insert row above', () => {
    it('should not insert row above when the menu is triggered by column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should insert row above of the clicked row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, -1, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A1', null, 'A2', 'A3', 'A4', 'A5']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert row above when the menu is triggered by corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual([null, 'A1', 'A2', 'A3', 'A4', 'A5']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ A : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert row above when the menu is triggered by focused row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A1', null, 'A2', 'A3', 'A4', 'A5']);
    });

    it('should not insert row above when the menu is triggered by focused corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should not insert row above when the menu is triggered by focused column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should not insert row above when the menu is triggered by corner and all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should insert row above when the menu is triggered by corner and all columns are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 0),
        colHeaders: true,
        rowHeaders: ['A', 'B', 'C', 'D', 'E'],
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(false);
      // Currently HoT doesn't support row headers shift as it support columns.
      // Should be `[1, 'A', 'B', 'C', 'D', 'E']`.
      expect(getRowHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 6]);
      expect(`
        |   |
        |===|
        | - |
        | - |
        | - |
        | - |
        | - |
        | - |
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert row above when the menu is triggered by corner and dataset is empty', () => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        colHeaders: true,
        rowHeaders: ['A', 'B', 'C', 'D', 'E'],
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert row above when the physical number of rows is the same as `maxRows` ' +
       'and some indexes are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 1),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        maxRows: 5,
      });

      const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'trimming');

      rowMapper.setValueAtIndex(1, true);
      render();

      contextMenu(getCell(0, 0, true));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   ║ - |
        |===:===|
        | - ║ # |
        |   ║   |
        |   ║   |
        |   ║   |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert row above of the clicked cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const item = selectContextMenuOption('Insert row above');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A1', null, 'A2', 'A3', 'A4', 'A5']);
      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    describe('UI', () => {
      it('should display a disabled entry, when there\'s nothing selected', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          height: 100,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        contextMenu();

        const item = selectContextMenuOption('Insert row above');

        expect(item.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
