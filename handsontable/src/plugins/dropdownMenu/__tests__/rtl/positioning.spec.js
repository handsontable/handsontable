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

    // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/dropdown-menu/

    it('should show tick from "Read only" element at proper place', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(10, 10),
        dropdownMenu: true,
        colHeaders: true,
        readOnly: true,
      });

      await dropdownMenu(0);

      const $readOnlyItem = $('.htDropdownMenu .ht_master .htCore td:contains(Read only)');
      const $tickItem = $readOnlyItem.find('span.selected');
      const tickItemOffset = $tickItem.offset();
      const $dropdownMenuRoot = $('.htDropdownMenu');
      const dropdownMenuOffset = $dropdownMenuRoot.offset();

      expect(tickItemOffset.top).forThemes(({ classic, main, horizon }) => {
        classic.toBe(135);
        main.toBe(155);
        horizon.toBe(194);
      });
      expect(tickItemOffset.left).forThemes(({ classic, main, horizon }) => {
        classic.toBe(dropdownMenuOffset.left + $dropdownMenuRoot.outerWidth() - 4);
        main.toBe(dropdownMenuOffset.left + 1);
        horizon.toBe(dropdownMenuOffset.left);
      });
    });
  });
});
