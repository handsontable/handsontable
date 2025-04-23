describe('CopyPaste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  describe('context menu `copy_with_column_headers` action', () => {
    it('should be available with different noun forms while creating custom menu', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['copy_with_column_headers'],
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      await selectCell(1, 1);
      await contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with header';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      await selectCell(1, 1, 2, 1); // 2 rows are selected
      await contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with header';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      await selectCell(1, 1, 1, 2); // 2 columns are selected
      await contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with headers';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      await selectCells([[0, 0, 0, 0], [1, 1, 1, 2]]); // the last layer has selected 2 columns
      await contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with headers';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }
    });

    it('should call plugin\'s `copyWithColumnHeaders()` method after menu item click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      spyOn(getPlugin('copyPaste'), 'copyWithColumnHeaders');

      await contextMenu(getCell(1, 1));
      await selectContextMenuOption('Copy with header');

      expect(getPlugin('copyPaste').copyWithColumnHeaders).toHaveBeenCalled();
    });

    it('should be enabled when the cells are selected and column headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      await contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled when the cells are selected and column headers are disabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: false,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      await contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be enabled when the column is selected and headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      await contextMenu(getCell(-1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when the row is selected and headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      await contextMenu(getCell(1, -1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled for non-contiguous selection and when the column headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      await selectCells([
        [1, 0, 2, 1],
        [1, 2, 3, 3],
      ]);
      await contextMenu(getCell(3, 3));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be enabled when all rows are hidden and headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      // hide all rows
      rowIndexMapper().createAndRegisterIndexMap('map', 'hiding', true);
      await render();

      await contextMenu(getCell(-1, 1)); // Column header "B"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all columns are hidden and headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      // hide all columns
      columnIndexMapper().createAndRegisterIndexMap('map', 'hiding', true);
      await render();

      await contextMenu(getCell(1, -1)); // Row header "2"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all rows are trimmed and headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      // trim all rows
      rowIndexMapper().createAndRegisterIndexMap('map', 'trimming', true);
      await render();

      await contextMenu(getCell(-1, 1)); // Column header "B"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all columns are trimmed and headers are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
        }
      });

      // trim all columns
      columnIndexMapper().createAndRegisterIndexMap('map', 'trimming', true);
      await render();

      await contextMenu(getCell(1, -1)); // Row header "2"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled when the single row header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      getPlugin('contextMenu').open($(getCell(1, -1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single column header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single corner is selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });
  });
});
