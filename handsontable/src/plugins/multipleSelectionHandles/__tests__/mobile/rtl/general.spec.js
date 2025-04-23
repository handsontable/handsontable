describe('MultipleSelectionHandles (RTL mode)', () => {
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
        $('body').find(`#${id}`).remove();
      }
    });

    it('should not stretch the container of the scrollable element (#9475)', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(5, 8),
        width: 400,
        height: 200
      });

      // try to scroll the viewport max to the left
      await scrollViewportHorizontally(9999);

      // there should be no scroll as the 8 columns fit to the table's width
      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
    });
  });
});
