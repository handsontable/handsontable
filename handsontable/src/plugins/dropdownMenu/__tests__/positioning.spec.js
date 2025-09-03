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
        classic.toBe(dropdownMenuOffset.left + 4);
        main.toBe(dropdownMenuOffset.left + 1);
        horizon.toBe(dropdownMenuOffset.left);
      });
    });
  });
});
