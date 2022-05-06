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

    it('should update the table height', () => {
      const hot = handsontable({
        startRows: 22,
        startCols: 5
      });

      const initialHeight = $(hot.rootElement).height();

      updateSettings({
        height: 300
      });

      expect($(hot.rootElement).height()).toBe(300);
      expect($(hot.rootElement).height()).not.toBe(initialHeight);
    });

    it('should reset the table height', () => {
      const hot = handsontable({
        startRows: 20,
        startCols: 5,
        height: 100,
      });

      updateSettings({
        height: null
      });

      expect($(hot.rootElement).height()).toBe((20 * 23) + 1); // rows * default cell height + border top
    });

    it('should allow height to be a number', () => {
      handsontable({
        startRows: 10,
        startCols: 10,
        height: 107
      });

      expect(spec().$container.height()).toBe(107);
    });

    it('should allow height to be a function', () => {
      handsontable({
        startRows: 10,
        startCols: 10,
        height() {
          return 107;
        }
      });

      expect(spec().$container.height()).toBe(107);
    });

    it('should update the table height after setting the new value as "auto"', () => {
      const hot = handsontable({
        startRows: 20,
        startCols: 5,
        height: 100,
      });

      const initialHeight = $(hot.rootElement).height();

      updateSettings({
        height: 'auto'
      });

      expect(hot.rootElement.style.height).toBe('auto');
      expect(hot.rootElement.style.overflow).toBe('');
      expect($(hot.rootElement).height()).toBe((20 * 23) + 1); // rows * default cell height + border top
      expect($(hot.rootElement).height()).not.toBe(initialHeight);
    });

    it('should not reset the table height, when the updateSettings config object doesn\'t have any height specified', () => {
      const hot = handsontable({
        startRows: 22,
        startCols: 5,
        height: 300
      });

      const initialHeight = $(hot.rootElement).height();

      updateSettings({
        rowHeaders: true
      });

      expect($(hot.rootElement).height()).toBe(initialHeight);
    });
  });
});
