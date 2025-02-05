describe('DropdownMenu', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
  ], ({ htmlDir, layoutDirection }) => {
    beforeEach(() => {
      $('html').attr('dir', htmlDir);
    });

    afterEach(() => {
      $('html').attr('dir', 'ltr');
    });

    describe('subMenu opening', () => {
      it('should open subMenu by default on the right position of the main menu', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
          colHeaders: true,
        });

        openDropdownSubmenuOption('Alignment', 0);

        await sleep(350);

        const $dropdownMenu = $('.htDropdownMenu');
        const dropdownOffset = $dropdownMenu.offset();
        const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const subMenuRoot = $('.htDropdownMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
          main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
        });
        expect(subMenuOffset.left).forThemes(({ classic, main }) => {
          // 3px comes from borders
          classic.toBeCloseTo(dropdownOffset.left + $dropdownMenu.outerWidth() + 3, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
          main.toBeCloseTo(dropdownOffset.left + $dropdownMenu.outerWidth() - 1, 0);
        });
      });

      it('should open subMenu on the left of the main menu if on the right there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
          colHeaders: true,
        });

        openDropdownSubmenuOption('Alignment', countCols() - 1);

        await sleep(350);

        const $dropdownMenu = $('.htDropdownMenu');
        const dropdownOffset = $dropdownMenu.offset();
        const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const subMenuRoot = $('.htDropdownMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
          main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
        });
        expect(subMenuOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(Math.floor(dropdownOffset.left - $dropdownMenu.outerWidth()));

          // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
          main.toBeCloseTo(Math.floor(dropdownOffset.left - $dropdownMenu.outerWidth() + 1));
        });
      });
    });

    it('should show tick from "Read only" element at proper place', () => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(10, 10),
        dropdownMenu: true,
        colHeaders: true,
        readOnly: true,
      });

      dropdownMenu(0);

      const $readOnlyItem = $('.htDropdownMenu .ht_master .htCore td:contains(Read only)');
      const $tickItem = $readOnlyItem.find('span.selected');
      const tickItemOffset = $tickItem.offset();
      const $dropdownMenuRoot = $('.htDropdownMenu');
      const dropdownMenuOffset = $dropdownMenuRoot.offset();

      expect(tickItemOffset.top).forThemes(({ classic, main }) => {
        classic.toBe(135);
        main.toBe(155);
      });
      expect(tickItemOffset.left).forThemes(({ classic, main }) => {
        classic.toBe(dropdownMenuOffset.left + 4);
        main.toBe(dropdownMenuOffset.left + 1);
      });
    });
  });

  describe('subMenu opening', () => {
    it('should open subMenu by default on the right-bottom position of the main menu (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
        dropdownMenu: true,
        colHeaders: true,
      });

      scrollViewportTo(0, countCols() - 1);

      await sleep(50);

      openDropdownSubmenuOption('Alignment', 80);

      await sleep(350);

      const $dropdownMenu = $('.htDropdownMenu');
      const dropdownOffset = $dropdownMenu.offset();
      const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
      const subMenuItemOffset = subMenuItem.offset();
      const subMenuRoot = $('.htDropdownMenuSub_Alignment');
      const subMenuOffset = subMenuRoot.offset();

      expect(subMenuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
      });
      expect(subMenuOffset.left).forThemes(({ classic, main }) => {
        // 3px comes from borders
        classic.toBeCloseTo(dropdownOffset.left + $dropdownMenu.outerWidth() + 3, 0);

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        main.toBeCloseTo(dropdownOffset.left + $dropdownMenu.outerWidth() - 1, 0);
      });
    });

    it('should open subMenu on the left-bottom of the main menu if on the right there\'s no space left (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
        dropdownMenu: true,
        colHeaders: true,
      });

      scrollViewportTo(0, countCols() - 1);
      render();

      await sleep(150);

      openDropdownSubmenuOption('Alignment', countCols() - 1);

      await sleep(400);

      const $dropdownMenu = $('.htDropdownMenu');
      const dropdownOffset = $dropdownMenu.offset();
      const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
      const subMenuItemOffset = subMenuItem.offset();
      const subMenuRoot = $('.htDropdownMenuSub_Alignment');
      const subMenuOffset = subMenuRoot.offset();

      expect(subMenuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
      });
      expect(subMenuOffset.left).forThemes(({ classic, main }) => {
        classic.toBe(Math.floor(dropdownOffset.left - $dropdownMenu.outerWidth()));

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        main.toBe(Math.floor(dropdownOffset.left - $dropdownMenu.outerWidth() + 1));
      });
    });
  });
});
