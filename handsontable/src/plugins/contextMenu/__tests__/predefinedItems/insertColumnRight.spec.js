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
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
      expect(`
        |   ║   : * :   :   :   :   |
        |===:===:===:===:===:===:===|
        | - ║   : A :   :   :   :   |
        | - ║   : 0 :   :   :   :   |
        | - ║   : 0 :   :   :   :   |
        | - ║   : 0 :   :   :   :   |
        | - ║   : 0 :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column when the menu is triggered by row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not insert column when the menu is triggered by row header for object-based dataset', () => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not insert column when the menu is triggered by focused row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not insert column when the menu is triggered by focused corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should insert column when the menu is triggered by focused column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
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
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', null]);
      expect(`
        |   ║ - : - : - : - : - : - |
        |===:===:===:===:===:===:===|
        | - ║ A : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column when the menu is triggered by corner for object-based dataset', () => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ A : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
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
      expect(getColHeader()).toEqual([1, 2, 3, 4, 5, 'F']);
      expect(`
        |   ║ - : - : - : - : - : - |
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
        |   ║ - |
        |===:===|
        | - ║ A |
        | - ║ 0 |
        | - ║ 0 |
        | - ║ 0 |
        | - ║ 0 |
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
        |   ║ - |
        |===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column on the right when the physical number of columns is the same as `maxCols` ' +
       'and some indexes are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        maxCols: 5,
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'trimming');

      columnMapper.setValueAtIndex(1, true);
      render();

      contextMenu(getCell(0, 0, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   ║ - :   :   :   |
        |===:===:===:===:===|
        | - ║ # :   :   :   |
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
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
      expect(`
        |   ║   : - :   :   :   :   |
        |===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   |
        | - ║   : # :   :   :   :   |
        |   ║   :   :   :   :   :   |
        |   ║   :   :   :   :   :   |
        |   ║   :   :   :   :   :   |
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

        const item = selectContextMenuOption('Insert column right');

        expect(item.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
