describe('settings', () => {
  describe('preventOverflow', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        $('body').find(`#${id}`).remove();
      }
    });

    it('should not render column double border on the bottom when `horizontal` option is used and the viewport is scrolled', async() => {
      const origMarginTop = document.body.style.marginTop;

      document.body.style.marginTop = '2000px';

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 400,
        height: 300,
        preventOverflow: 'horizontal',
      });

      await scrollWindowTo(0, 100);

      expect(getMaster().hasClass('innerBorderTop')).toBe(false);

      document.body.style.marginTop = origMarginTop;
    });

    it('should not render row double border on the right when `vertical` option is used and the viewport is scrolled', async() => {
      const origMarginLeft = document.body.style.marginLeft;

      document.body.style.marginLeft = '2000px';

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 400,
        height: 300,
        preventOverflow: 'vertical',
      });

      await scrollWindowTo(100, 0);

      expect(getMaster().hasClass('innerBorderInlineStart')).toBe(false);
      expect(getMaster().hasClass('innerBorderLeft')).toBe(false);

      document.body.style.marginLeft = origMarginLeft;
    });
  });
});
