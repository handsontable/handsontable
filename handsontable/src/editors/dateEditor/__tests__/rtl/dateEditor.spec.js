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

    it('should render Pikaday within element that contains correct "dir" attribute value', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(5, 2),
        columns: [
          { type: 'date' },
          { type: 'date' }
        ]
      });

      await selectCell(1, 1);
      await keyDown('enter');

      const datePicker = getActiveEditor().datePicker;
      const config = getActiveEditor().$datePicker.config();

      expect(datePicker.getAttribute('dir')).toBe('rtl');
      // it's set as `false` in RTL due to https://github.com/Pikaday/Pikaday/issues/647 bug. The Pikaday layout
      // direction mode is controlled by above "dir" attribute.
      expect(config.isRTL).toBe(false);
    });
  });
});
