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

  describe('read-only comment', () => {
    describe('UI', () => {
      it('should disable the item when all cells are selected (using keyboard shortcut)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
        });

        selectCell(1, 1);
        keyDownUp(['control/meta', 'a']);
        contextMenu(getCell(1, 1));

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all cells are selected (using `selectAll` method)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
        });

        selectCell(1, 1);
        selectAll();
        contextMenu(getCell(1, 1));

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are hidden', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
          hiddenRows: { // The HidingMap should be used instead of the plugin.
            rows: [0, 1, 2, 3, 4],
          },
        });

        contextMenu(getCell(-1, 1)); // Column header "B"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are hidden', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          rowHeaders: true,
          contextMenu: true,
          hiddenColumns: { // The HidingMap should be used instead of the plugin.
            columns: [0, 1, 2, 3, 4],
          },
        });

        contextMenu(getCell(1, -1)); // Row header "2"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are trimmed', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
          trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
        });

        contextMenu(getCell(-1, 1)); // Column header "B"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are trimmed', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          rowHeaders: true,
          contextMenu: true,
          columns: [], // The TrimmingMap should be used instead of the `columns` option.
        });

        contextMenu(getCell(1, -1)); // Row header "2"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when the single row header is selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          navigableHeaders: true,
        });

        selectCell(1, -1);
        getPlugin('contextMenu').open($(getCell(1, -1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when the single column header is selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          navigableHeaders: true,
        });

        selectCell(-1, 1);
        getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when the single corner is selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          navigableHeaders: true,
        });

        selectCell(-1, -1);
        getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
