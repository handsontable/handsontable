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
      it('should disable the item when all cells are selected (using keyboard shortcut)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          // A comment inside the selection, so the guard alone has to disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          colHeaders: true,
          contextMenu: true,
        });

        await selectCell(1, 1);
        await keyDownUp(['control/meta', 'a']);
        await contextMenu(getCell(1, 1));

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all cells are selected (using `selectAll` method)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          // A comment inside the selection, so the guard alone has to disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          colHeaders: true,
          contextMenu: true,
        });

        await selectCell(1, 1);
        await selectAll();
        await contextMenu(getCell(1, 1));

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          // A comment inside the selection, so the guard alone has to disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          colHeaders: true,
          contextMenu: true,
          hiddenRows: { // The HidingMap should be used instead of the plugin.
            rows: [0, 1, 2, 3, 4],
          },
        });

        await contextMenu(getCell(-1, 1)); // Column header "B"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          // A comment inside the selection, so the guard alone has to disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          rowHeaders: true,
          contextMenu: true,
          hiddenColumns: { // The HidingMap should be used instead of the plugin.
            columns: [0, 1, 2, 3, 4],
          },
        });

        await contextMenu(getCell(1, -1)); // Row header "2"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are trimmed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          // A comment inside the selection, so the guard alone has to disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          colHeaders: true,
          contextMenu: true,
          trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
        });

        await contextMenu(getCell(-1, 1)); // Column header "B"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are trimmed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          comments: true,
          // A comment inside the selection, so the guard alone has to disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          rowHeaders: true,
          contextMenu: true,
          columns: [], // The TrimmingMap should be used instead of the `columns` option.
        });

        await contextMenu(getCell(1, -1)); // Row header "2"

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when a row is selected with the focus on its header', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          // The range covers the comment on (1, 1) while the highlight stays on the header, so only
          // the header guard can disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          navigableHeaders: true,
        });

        await selectRows(1, 1, -1);
        getPlugin('contextMenu').open($(getCell(1, -1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });

      it('should be disabled when a column is selected with the focus on its header', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          comments: true,
          // The range covers the comment on (1, 1) while the highlight stays on the header, so only
          // the header guard can disable the item.
          cell: [{ row: 1, col: 1, comment: { value: 'Note' } }],
          navigableHeaders: true,
        });

        await selectColumns(1, 1, -1);
        getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
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
          // Only a select-all puts the highlight on the corner while the range covers cells, and the
          // select-all guard catches that first, so the corner-only selection holds no cell to seed.
          navigableHeaders: true,
        });

        await selectCell(-1, -1);
        getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

        const menuItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read-only comment';
        });

        expect(menuItem.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
