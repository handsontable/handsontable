describe('ContextMenu (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('`open()` method', () => {
      it('should open context menu by default on the left-bottom position', () => {
        handsontable({
          layoutDirection,
          contextMenu: true,
        });

        selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.top + 1, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2200#issuecomment-2612221115
          main.toBeCloseTo(cellOffset.top + 2, 0);
        });
        expect(menuOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - menuWidth, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2200#issuecomment-2612221115
          main.toBeCloseTo(cellOffset.left - menuWidth - 1, 0);
        });
      });

      it.forTheme('classic')('should open context menu on the left-top position if on the right and ' +
        'bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it.forTheme('main')('should open context menu on the left-top position if on the right and ' +
        'bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), 4),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight - 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth - 1, 0);
      });

      it('should open context menu on the right-bottom position if on the left there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the left, select the last cell
        selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.top + 1, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2200#issuecomment-2612221115
          main.toBeCloseTo(cellOffset.top + 2, 0);
        });
        expect(menuOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2200#issuecomment-2612221115
          main.toBeCloseTo(cellOffset.left + 1, 0);
        });
      });

      it.forTheme('classic')('should open context menu on the right-top position if on the left and ' +
        'bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it.forTheme('main')('should open context menu on the right-top position if on the left and ' +
        'bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight - 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left + 1, 0);
      });
    });
  });
});
