describe('DateEditor (RTL mode)', () => {
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

    // Datepicker positioning E2E tests have been moved to visual tests.
    // See ./visual-tests/tests/js-only/editors/date/

    it('should render the editor TEXTAREA in the correct position when a date cell is opened', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(5, 5),
        type: 'date',
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());
    });
  });
});
