describe('ContextMenu (RTL mode)', () => {
  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    beforeEach(() => {
      $('html').attr('dir', htmlDir);
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

    it('should show tick from "Read only" element at proper place', () => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        readOnly: true,
      });

      selectCell(0, 0);

      const cell = getCell(0, 0);

      contextMenu(cell);

      const $readOnlyItem = $('.htContextMenu .ht_master .htCore td:contains(Read only)');
      const $tickItem = $readOnlyItem.find('span.selected');
      const tickItemOffset = $tickItem.offset();
      const $contextMenuRoot = $('.htContextMenu');
      const contextMenuOffset = $contextMenuRoot.offset();

      expect(tickItemOffset.top).toBe(216);
      expect(tickItemOffset.left).toBe(contextMenuOffset.left + $contextMenuRoot.outerWidth() - 4);
    });
  });

  describe('subMenu opening', () => {
    it('should open subMenu by default on the left-bottom position of the main menu (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
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

    it('should open subMenu on the right-bottom of the main menu if on the left there\'s no space left (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
        contextMenu: true,
      });

      scrollViewportTo(0, 99);

      await sleep(50);

      selectCell(0, 93);
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
  });
});
