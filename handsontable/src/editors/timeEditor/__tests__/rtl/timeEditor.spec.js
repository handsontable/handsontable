describe('TimeEditor (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: hidden;"></div>`)
        .appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should render an editable editor\'s element with "dir" attribute set as "ltr"', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        editor: 'time',
      });

      selectCell(0, 0);

      const editableElement = getActiveEditor().TEXTAREA;

      expect(editableElement.getAttribute('dir')).toBe('ltr');
    });
  });
});
