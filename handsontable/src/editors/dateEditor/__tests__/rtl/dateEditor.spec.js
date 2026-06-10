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

    it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(2, 5),
        editor: 'date',
      });

      await selectCell(0, 0);

      const editableElement = getActiveEditor().TEXTAREA;

      expect(editableElement.getAttribute('dir')).toBeNull();
    });

    it('should render an input element with type="date" in RTL mode', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(2, 5),
        columns: [
          { type: 'date' },
          { type: 'date' }
        ]
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      expect(editor.TEXTAREA.getAttribute('type')).toBe('date');
    });
  });
});
