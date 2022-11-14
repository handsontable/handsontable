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

  describe('context menu `copy` action', () => {
    it('should be available while creating custom menu', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: ['copy'],
      });

      contextMenu(getCell(1, 1));

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem[0]).not.toBeUndefined();
    });

    it('should call plugin\'s `copyCellsOnly()` method after menu item click', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
      });

      spyOn(getPlugin('copyPaste'), 'copyCellsOnly');

      contextMenu(getCell(1, 1));
      simulateClick($('.htContextMenu tbody tr td:contains("Copy")'));

      expect(getPlugin('copyPaste').copyCellsOnly).toHaveBeenCalled();
    });

    it('should be enabled when the cells are selected and headers are enabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when the cells are selected and headers are disabled', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: false,
        colHeaders: false,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when the column is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1));

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be enabled when the row is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, -1));

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });

    it('should be disabled for non-contiguous selection', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
      });

      selectCells([
        [1, 0, 2, 1],
        [1, 2, 3, 3],
      ]);
      contextMenu(getCell(3, 3));

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should enable the item when all rows are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: true,
      });

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      contextMenu(getCell(-1, 1)); // Column header "B"

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });

    it('should enable the item when all columns are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        contextMenu: true,
      });

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
    });

    it('should disable the item when all rows are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: true,
      });

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(-1, 1)); // Column header "B"

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should disable the item when all columns are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        contextMenu: true,
      });

      // trim all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      contextMenu(getCell(1, -1)); // Row header "2"

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Copy';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });
  });
});
