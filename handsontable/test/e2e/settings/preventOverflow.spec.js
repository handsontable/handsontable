describe('settings', () => {
  describe('preventOverflow', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
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

    it('should keep vertical keyboard scrolling after `updateSettings()` when `horizontal` option is used', async() => {
      const rootWindow = spec().$container[0].ownerDocument.defaultView;

      handsontable({
        data: createSpreadsheetData(200, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 400,
        preventOverflow: 'horizontal',
      });

      await selectCell(20, 0);

      const topOverlay = tableView()._wt.wtOverlays.topOverlay;
      const initialScrollY = rootWindow.scrollY;

      expect(topOverlay.mainTableScrollableElement).toBe(rootWindow);

      await updateSettings({
        className: 'after-update-settings',
      });

      expect(topOverlay.mainTableScrollableElement).toBe(rootWindow);

      for (let i = 0; i < 10; i++) {
        await keyDownUp('arrowdown');
      }

      expect(rootWindow.scrollY).toBeGreaterThan(initialScrollY);
    });
  });
});
