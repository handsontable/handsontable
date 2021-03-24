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

  describe('cut', () => {
    describe('UI', () => {
      it('should enable the item when all rows are hidden', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          contextMenu: true,
          hiddenRows: { // The HidingMap should be used instead of the plugin.
            rows: [0, 1, 2, 3, 4],
          },
        });

        contextMenu(getCell(-1, 1)); // Column header "B"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Cut';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
      });

      it('should enable the item when all columns are hidden', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          contextMenu: true,
          hiddenColumns: { // The HidingMap should be used instead of the plugin.
            columns: [0, 1, 2, 3, 4],
          },
        });

        contextMenu(getCell(1, -1)); // Row header "2"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Cut';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
      });

      it('should disable the item when all rows are trimmed', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          contextMenu: true,
          trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
        });

        contextMenu(getCell(-1, 1)); // Column header "B"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Cut';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are trimmed', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          contextMenu: true,
          columns: [], // The TrimmingMap should be used instead of the `columns` option.
        });

        contextMenu(getCell(1, -1)); // Row header "2"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Cut';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
