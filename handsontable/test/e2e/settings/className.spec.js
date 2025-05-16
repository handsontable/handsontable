describe('settings', () => {
  describe('className', () => {
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

    it('should original classNames stay after updateSettings (without headers)', async() => {
      const hot = handsontable({});

      expect(hot.rootElement.classList.contains('class-1')).toBe(false);
      expect(hot.rootElement.classList.contains('handsontable')).toBe(true);

      await updateSettings({ className: ['class-1'] });

      expect(hot.rootElement.classList.contains('class-1')).toBe(true);
      expect(hot.rootElement.classList.contains('handsontable')).toBe(true);
    });

    it('should original classNames stay after updateSettings (with headers)', async() => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot.rootElement.classList.contains('class-1')).toBe(false);
      expect(hot.rootElement.classList.contains('handsontable')).toBe(true);
      expect(hot.rootElement.classList.contains('htRowHeaders')).toBe(true);
      expect(hot.rootElement.classList.contains('htColumnHeaders')).toBe(true);

      await updateSettings({ className: ['class-1'] });

      expect(hot.rootElement.classList.contains('class-1')).toBe(true);
      expect(hot.rootElement.classList.contains('handsontable')).toBe(true);
      expect(hot.rootElement.classList.contains('htRowHeaders')).toBe(true);
      expect(hot.rootElement.classList.contains('htColumnHeaders')).toBe(true);
    });

    it('should update className accordingly', async() => {
      const hot = handsontable({
        data: [[1, true]],
        className: ['class-1', 'class-2'],
      });

      expect(hot.rootElement.classList.contains('class-1')).toBe(true);
      expect(hot.rootElement.classList.contains('class-2')).toBe(true);
      expect(getCellMeta(0, 0).className).toEqual(['class-1', 'class-2']);
      expect(getCellMeta(0, 1).className).toEqual(['class-1', 'class-2']);

      await updateSettings({ className: ['class-1'] });

      expect(hot.rootElement.classList.contains('class-1')).toBe(true);
      expect(hot.rootElement.classList.contains('class-2')).toBe(false);
      expect(getCellMeta(0, 0).className).toEqual(['class-1']);
      expect(getCellMeta(0, 1).className).toEqual(['class-1']);
    });
  });
});
