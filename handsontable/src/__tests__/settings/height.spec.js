describe('settings', () => {
  describe('height', () => {
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

    it('should update the table height', async() => {
      const hot = handsontable({
        startRows: 22,
        startCols: 5
      });

      const initialHeight = $(hot.rootElement).height();

      await updateSettings({
        height: 300
      });

      expect($(hot.rootElement).height()).toBe(300);
      expect($(hot.rootElement).height()).not.toBe(initialHeight);
    });

    it('should allow height to be a number', async() => {
      handsontable({
        startRows: 10,
        startCols: 10,
        height: 107
      });

      expect(spec().$container.height()).toBe(107);
    });

    it('should allow height to be a function', async() => {
      handsontable({
        startRows: 10,
        startCols: 10,
        height() {
          return 107;
        }
      });

      expect(spec().$container.height()).toBe(107);
    });

    it('should not reset the table height, when the updateSettings config object doesn\'t have any height specified', async() => {
      const hot = handsontable({
        startRows: 22,
        startCols: 5,
        height: 300
      });

      const initialHeight = $(hot.rootElement).height();

      await updateSettings({
        rowHeaders: true
      });

      expect($(hot.rootElement).height()).toBe(initialHeight);
    });

    it('should allow height to be a bare numeric string or a pixel string', async() => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        height: '107'
      });

      expect(hot.rootElement.style.height).toBe('107px');
      expect(spec().$container.height()).toBe(107);

      await updateSettings({ height: '120px' });

      expect(hot.rootElement.style.height).toBe('120px');
      expect(spec().$container.height()).toBe(120);
    });

    it('should write `auto` as inline `height: auto` with no overflow, and leave the rows to the window', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(200, 5),
        height: 'auto'
      });

      expect(hot.rootElement.style.height).toBe('auto');
      expect(hot.rootElement.style.overflow).toBe('');
      expect(hot.rootElement.style.overflowX).toBe('');
      expect(hot.rootElement.style.overflowY).toBe('');
      expect(hot.view.isVerticallyScrollableByWindow()).toBe(true);
      // The rows are still virtualized: the grid renders the window's band, not all 200 rows.
      expect(hot.countRenderedRows()).toBeGreaterThan(0);
      expect(hot.countRenderedRows()).toBeLessThan(200);
    });

    it('should clear the clip when the height moves to `auto`, and write it back for a number', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(200, 5),
        height: 300
      });

      expect(hot.rootElement.style.overflow).toBe('clip');
      expect(hot.view.isVerticallyScrollableByWindow()).toBe(false);

      await updateSettings({ height: 'auto' });

      expect(hot.rootElement.style.height).toBe('auto');
      expect(hot.rootElement.style.overflow).toBe('');
      expect(hot.view.isVerticallyScrollableByWindow()).toBe(true);

      await updateSettings({ height: 300 });

      expect(hot.rootElement.style.height).toBe('300px');
      expect(hot.rootElement.style.overflow).toBe('clip');
      expect(hot.view.isVerticallyScrollableByWindow()).toBe(false);
      expect($(hot.rootElement).height()).toBe(300);
    });

    it('should ignore a value that cannot be read as a size, warn once, and keep the height as it was', async() => {
      spyOn(console, 'warn');

      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        height: 107
      });

      await updateSettings({ height: 'abc' });
      await updateSettings({ height: 'abc' });

      expect(hot.rootElement.style.height).toBe('107px');
      expect(hot.rootElement.style.overflow).toBe('clip');
      expect(spec().$container.height()).toBe(107);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn.calls.argsFor(0)[0]).toContain('`height` option');
      expect(console.warn.calls.argsFor(0)[0]).toContain('"abc"');

      await updateSettings({ height: -100 });
      await updateSettings({ height: 'min-content' });

      expect(hot.rootElement.style.height).toBe('107px');
      expect(console.warn).toHaveBeenCalledTimes(3);
    });

    it('should leave no clip behind a value that cannot be read as a size on a grid without a height', async() => {
      spyOn(console, 'warn');

      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        height: 'abc'
      });

      expect(hot.rootElement.style.height).toBe('');
      expect(hot.rootElement.style.overflow).toBe('');
      expect(hot.view.isVerticallyScrollableByWindow()).toBe(true);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('should pass a CSS length the grid does not know through as written', async() => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        height: 'calc(100px + 7px)'
      });

      // Chrome folds the expression when it reads the inline style back (`calc(107px)`).
      expect(hot.rootElement.style.height).toMatch(/^calc\(/);
      expect(hot.rootElement.style.overflow).toBe('clip');
      expect(spec().$container.height()).toBe(107);
    });

    it('should reset the height only with `null`, keeping the width set through the option', async() => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        height: 107,
        width: 200
      });

      await updateSettings({ height: null });

      expect(hot.rootElement.style.height).toBe('');
      expect(hot.rootElement.style.width).toBe('200px');
      expect(hot.rootElement.style.overflowY).toBe('');
      expect(hot.rootElement.style.overflowX).toBe('clip');
      expect(hot.view.isVerticallyScrollableByWindow()).toBe(true);
    });
  });
});
