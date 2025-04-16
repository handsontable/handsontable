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
    it('should insert column on the right of the clicked column header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, 1, true));

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

    it('should not insert column when the menu is triggered by row header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not insert column when the menu is triggered by row header for object-based dataset', async() => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not insert column when the menu is triggered by focused row header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not insert column when the menu is triggered by focused corner', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should insert column when the menu is triggered by focused column header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
    });

    it('should insert column on the right when the menu is triggered by corner', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

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

    it('should not insert column when the menu is triggered by corner for object-based dataset', async() => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

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

    it('should insert column on the right when the menu is triggered by corner and all rows are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: [1, 2, 3, 4, 5],
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      await contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getColHeader()).toEqual([1, 2, 3, 4, 5, 'F']);
      expect(`
        |   ║ - : - : - : - : - : - |
        |===:===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right when the menu is triggered by corner and all columns are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

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

    it('should insert column on the right when the menu is triggered by corner and dataset is empty', async() => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(`
        |   ║ - |
        |===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column on the right when the physical number of columns is the same as `maxCols` ' +
       'and some indexes are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        maxCols: 5,
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'trimming');

      columnMapper.setValueAtIndex(1, true);
      await render();

      await contextMenu(getCell(0, 0, true));

      const item = selectContextMenuOption('Insert column right');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   ║ - :   :   :   |
        |===:===:===:===:===|
        | - ║ # :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the right of the clicked cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(1, 1));

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
      it('should display a disabled entry, when there\'s nothing selected', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          height: 100,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        await contextMenu();

        const item = selectContextMenuOption('Insert column right');

        expect(item.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
