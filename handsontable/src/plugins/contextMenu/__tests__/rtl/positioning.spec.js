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

    describe('menu opening', () => {
      it('should render context menu by default on the left-bottom position', () => {
        handsontable({
          layoutDirection,
          contextMenu: true,
        });

        selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        contextMenu(cell);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it('should render context menu on the left-top position if on the right and bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        contextMenu(cell);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it('should render context menu on the right-bottom position if on the left there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the left, select the last cell
        selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        contextMenu(cell);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it('should render context menu on the right-top position if on the left and bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        contextMenu(cell);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });
    });

    describe('subMenu opening', () => {
      it('should open subMenu by default on the left-bottom position of the main menu', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(0, 0);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        expect(subMenuOffset.left).toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth(), 0);
      });

      it('should open subMenu on the left-top of the main menu if on the right and bottom there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
          contextMenu: true,
        });

        selectCell(countRows() - 1, 0);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // 3px comes from bottom borders
        expect(subMenuOffset.top)
          .toBeCloseTo(subMenuItemOffset.top - subMenuRoot.outerHeight() + subMenuItem.outerHeight() + 3, 0);
        expect(subMenuOffset.left)
          .toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth(), 0);
      });

      it('should open subMenu on the right-bottom of the main menu if on the left there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(0, countCols() - 1);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        expect(subMenuOffset.left).toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth(), 0);
      });

      it('should open subMenu on the right-top of the main menu if on the left and bottom there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(countRows() - 1, countCols() - 1);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // 3px comes from bottom borders
        expect(subMenuOffset.top)
          .toBeCloseTo(subMenuItemOffset.top - subMenuRoot.outerHeight() + subMenuItem.outerHeight() + 3, 0);
        expect(subMenuOffset.left)
          .toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth(), 0);
      });
    });
  });
});
