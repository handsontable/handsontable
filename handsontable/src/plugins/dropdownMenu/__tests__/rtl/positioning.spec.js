describe('DropdownMenu (RTL mode)', () => {
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
      it('should open subMenu by default on the left position of the main menu', async() => {
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
        const subMenuWidth = subMenuRoot.outerWidth();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        expect(subMenuOffset.left).toBe(Math.floor(dropdownOffset.left - subMenuWidth));
      });

      it('should open subMenu on the right of the main menu if on the left there\'s no space left', async() => {
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
        const dropdownWidth = $dropdownMenu.outerWidth();
        const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const subMenuRoot = $('.htDropdownMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        expect(subMenuOffset.left).toBeCloseTo(dropdownOffset.left + dropdownWidth, 0);
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

      expect(tickItemOffset.top).toBe(135);
      expect(tickItemOffset.left).toBe(dropdownMenuOffset.left + $dropdownMenuRoot.outerWidth() - 4);
    });
  });

  describe('subMenu opening', () => {
    it('should open subMenu by default on the left-bottom position of the main menu (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
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
      const subMenuWidth = subMenuRoot.outerWidth();

      expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
      expect(subMenuOffset.left).toBe(Math.floor(dropdownOffset.left - subMenuWidth));
    });

    it('should open subMenu on the right-bottom of the main menu if on the left there\'s no space left (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
        dropdownMenu: true,
        colHeaders: true,
      });

      scrollViewportTo(0, 99);

      await sleep(50);

      openDropdownSubmenuOption('Alignment', 93);

      await sleep(350);

      const $dropdownMenu = $('.htDropdownMenu');
      const dropdownOffset = $dropdownMenu.offset();
      const dropdownWidth = $dropdownMenu.outerWidth();
      const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
      const subMenuItemOffset = subMenuItem.offset();
      const subMenuRoot = $('.htDropdownMenuSub_Alignment');
      const subMenuOffset = subMenuRoot.offset();

      expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
      expect(subMenuOffset.left).toBe(Math.floor(dropdownOffset.left + dropdownWidth));
    });
  });
});
