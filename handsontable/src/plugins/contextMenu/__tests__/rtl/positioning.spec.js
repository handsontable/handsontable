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

    // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/context-menu/

    it('should show tick from "Read only" element at proper place', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        readOnly: true,
      });

      await selectCell(0, 0);

      const cell = getCell(0, 0);

      await contextMenu(cell);

      const $readOnlyItem = $('.htContextMenu .ht_master .htCore td:contains(Read only)');
      const $tickItem = $readOnlyItem.find('span.selected');
      const tickItemOffset = $tickItem.offset();
      const $contextMenuRoot = $('.htContextMenu');
      const contextMenuOffset = $contextMenuRoot.offset();

      expect(tickItemOffset.top).forThemes(({ classic, main, horizon }) => {
        classic.toBe(216);
        main.toBe(247);
        horizon.toBe(314);
      });
      expect(tickItemOffset.left).forThemes(({ classic, main, horizon }) => {
        classic.toBe(contextMenuOffset.left + $contextMenuRoot.outerWidth() - 4);
        main.toBe(contextMenuOffset.left + 1);
        horizon.toBe(contextMenuOffset.left);
      });
    });
  });
});
