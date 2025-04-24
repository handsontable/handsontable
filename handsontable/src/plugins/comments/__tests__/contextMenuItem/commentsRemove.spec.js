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

  describe('delete comment', () => {
    describe('UI', () => {
      it('should disable the item when all cells are selected (using keyboard shortcut)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
        });

        await selectCell(1, 1);
        await keyDownUp(['control/meta', 'a']);
        await contextMenu(getCell(1, 1));

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all cells are selected (using `selectAll` method)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
        });

        await selectCell(1, 1);
        await selectAll();
        await contextMenu(getCell(1, 1));

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
          hiddenRows: { // The HidingMap should be used instead of the plugin.
            rows: [0, 1, 2, 3, 4],
          },
        });

        await contextMenu(getCell(-1, 1)); // Column header "B"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          rowHeaders: true,
          contextMenu: true,
          hiddenColumns: { // The HidingMap should be used instead of the plugin.
            columns: [0, 1, 2, 3, 4],
          },
        });

        await contextMenu(getCell(1, -1)); // Row header "2"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are trimmed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          colHeaders: true,
          contextMenu: true,
          trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
        });

        await contextMenu(getCell(-1, 1)); // Column header "B"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are trimmed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          rowHeaders: true,
          contextMenu: true,
          columns: [], // The TrimmingMap should be used instead of the `columns` option.
        });

        await contextMenu(getCell(1, -1)); // Row header "2"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when the single row header is selected', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          navigableHeaders: true,
        });

        await selectCell(1, -1);
        getPlugin('contextMenu').open($(getCell(1, -1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when the single column header is selected', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          navigableHeaders: true,
        });

        await selectCell(-1, 1);
        getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when the single corner is selected', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          navigableHeaders: true,
        });

        await selectCell(-1, -1);
        getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Delete comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
