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

  describe('context menu `copy_with_column_group_headers` action', () => {
    it('should be available with different noun forms while creating custom menu', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['copy_with_column_group_headers'],
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      selectCell(1, 1);
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with group header';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      selectCell(1, 1, 2, 1); // 2 rows are selected
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with group header';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      selectCell(1, 1, 1, 2); // 2 columns are selected
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with group headers';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }

      selectCells([[0, 0, 0, 0], [1, 1, 1, 2]]); // the last layer has selected 2 columns
      contextMenu();

      {
        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Copy with group headers';
        });

        expect(menuItem[0]).not.toBeUndefined();
      }
    });

    it('should call plugin\'s `copyWithAllColumnHeaders()` method after menu item click', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      spyOn(getPlugin('copyPaste'), 'copyWithAllColumnHeaders');

      contextMenu(getCell(1, 1));
      selectContextMenuOption('Copy with group header');

      expect(getPlugin('copyPaste').copyWithAllColumnHeaders).toHaveBeenCalled();
    });

    it('should be enabled when the cells are selected and NestedHeaders plugin is enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled when the cells are selected and only column headers are enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        }
      });

      contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the cells are selected and column headers are disabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: false,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        }
      });

      contextMenu(getCell(1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be enabled when the column is selected and NestedHeaders plugin is enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      contextMenu(getCell(-1, 1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when the row is selected and NestedHeaders plugin is enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      contextMenu(getCell(1, -1));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled for non-contiguous selection and NestedHeaders plugin is enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      selectCells([
        [1, 0, 2, 1],
        [1, 2, 3, 3],
      ]);
      contextMenu(getCell(3, 3));

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be enabled when all rows are hidden and NestedHeaders plugin is enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      contextMenu(getCell(-1, 1)); // Column header "B"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all columns are hidden and NestedHeaders plugin is enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all rows are trimmed and NestedHeaders plugin is enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(-1, 1)); // Column header "B"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when all columns are trimmed and NestedHeaders plugin is enabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      // trim all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group headers';
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
          copyColumnGroupHeaders: true,
        },
        navigableHeaders: true,
      });

      selectCell(1, -1);
      getPlugin('contextMenu').open($(getCell(1, -1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
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
          copyColumnGroupHeaders: true,
        },
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
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
          copyColumnGroupHeaders: true,
        },
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

      const menuItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy with group header';
      });

      expect(menuItem.hasClass('htDisabled')).toBe(true);
    });
  });
});
