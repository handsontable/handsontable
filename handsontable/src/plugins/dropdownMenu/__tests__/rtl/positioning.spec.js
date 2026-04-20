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

      const readOnlyItemOffset = $readOnlyItem.offset();

      expect(tickItemOffset.top).toBe(readOnlyItemOffset.top);
      // The tick sits flush with the menu's left content edge. The menu's
      // outer-left to content-left gap equals the menu container border
      // width, which is 1px on main and 0px on horizon. Derive it from the
      // DOM so the assertion is theme-invariant.
      const menuEl = $dropdownMenuRoot.filter(':visible')[0] || $dropdownMenuRoot[0];
      const htMaster = menuEl.querySelector('.ht_master');
      const borderLeft = htMaster
        ? parseFloat(window.getComputedStyle(htMaster).borderLeftWidth) || 0
        : 0;

      expect(tickItemOffset.left).toBe(dropdownMenuOffset.left + borderLeft);
    });
  });
});
