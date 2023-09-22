describe('CopyPaste', () => {
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

  describe('context menu `copy_column_headers_only` action', () => {
    it('should be available with different noun forms while creating custom menu', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['copy_column_headers_only'],
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      selectCell(1, 1);
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy header only';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      selectCell(1, 1, 2, 1); // 2 rows are selected
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy header only';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      selectCell(1, 1, 1, 2); // 2 columns are selected
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy headers only';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      selectCells([[0, 0, 0, 0], [1, 1, 1, 2]]); // the last layer has selected 2 columns
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy headers only';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }
    });

    it('should call plugin\'s `copyColumnHeadersOnly()` method after menu item click', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      spyOn(getPlugin('copyPaste'), 'copyColumnHeadersOnly');

      contextMenu(getCell(1, 1));
      selectContextMenuOption('Copy header only');

      expect(getPlugin('copyPaste').copyColumnHeadersOnly).toHaveBeenCalled();
    });

    it('should be enabled when the cells are selected and column headers are enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy header only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled when the cells are selected and column headers are disabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: false,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy header only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be enabled when the column is selected and headers are enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      contextMenu(getCell(-1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when the row is selected and headers are enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      contextMenu(getCell(1, -1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled for non-contiguous selection and when the column headers are enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      selectCells([
        [1, 0, 2, 1],
        [1, 2, 3, 3],
      ]);
      contextMenu(getCell(3, 3));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be enabled when all rows are hidden and headers are enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      contextMenu(getCell(-1, 1)); // Column header "B"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all columns are hidden and headers are enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all rows are trimmed and headers are enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(-1, 1)); // Column header "B"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all columns are trimmed and headers are enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        }
      });

      // trim all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy headers only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled when the single row header is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        },
        navigableHeaders: true,
      });

      selectCell(1, -1);
      getPlugin('contextMenu').open($(getCell(1, -1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy header only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single column header is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        },
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy header only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single corner is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
        },
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy header only';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });
  });
});
