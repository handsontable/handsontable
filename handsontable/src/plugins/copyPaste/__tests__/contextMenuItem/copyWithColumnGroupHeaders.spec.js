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

  describe('copyWithColumnGroupHeaders', () => {
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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

      // trim all rows
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(() => {
        return this.textContent === 'Copy with group headers';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });
  });
});
