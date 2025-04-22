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

  describe('"Borders" entry', () => {
    it('should be disabled when the single row header is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        customBorders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      getPlugin('contextMenu').open($(getCell(1, -1)).offset());

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single column header is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        customBorders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single corner is selected', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        customBorders: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });
  });
});
