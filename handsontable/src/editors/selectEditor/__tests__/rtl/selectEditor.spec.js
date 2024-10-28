describe('SelectEditor (RTL mode)', () => {
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

    it('should render an editable editor\'s element without messing with "dir" attribute', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        editor: 'select',
      });

      selectCell(0, 0);

      const editableElement = getActiveEditor().select;

      expect(editableElement.getAttribute('dir')).toBeNull();
    });
  });
});
