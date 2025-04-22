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

    it('should original classNames stay after updateSettings (without headers)', () => {
      handsontable({});

      const container = spec().$container[0];

      expect(container.classList.contains('class-1')).toBe(false);
      expect(container.classList.contains('handsontable')).toBe(true);

      updateSettings({ className: ['class-1'] });

      expect(container.classList.contains('class-1')).toBe(true);
      expect(container.classList.contains('handsontable')).toBe(true);
    });

    it('should original classNames stay after updateSettings (with headers)', () => {
      handsontable({
        colHeaders: true,
        rowHeaders: true,
      });

      const container = spec().$container[0];

      expect(container.classList.contains('class-1')).toBe(false);
      expect(container.classList.contains('handsontable')).toBe(true);
      expect(container.classList.contains('htRowHeaders')).toBe(true);
      expect(container.classList.contains('htColumnHeaders')).toBe(true);

      updateSettings({ className: ['class-1'] });

      expect(container.classList.contains('class-1')).toBe(true);
      expect(container.classList.contains('handsontable')).toBe(true);
      expect(container.classList.contains('htRowHeaders')).toBe(true);
      expect(container.classList.contains('htColumnHeaders')).toBe(true);
    });

    it('should update className accordingly', () => {
      handsontable({
        data: [[1, true]],
        className: ['class-1', 'class-2'],
      });

      const container = spec().$container[0];

      expect(container.classList.contains('class-1')).toBe(true);
      expect(container.classList.contains('class-2')).toBe(true);
      expect(getCellMeta(0, 0).className).toEqual(['class-1', 'class-2']);
      expect(getCellMeta(0, 1).className).toEqual(['class-1', 'class-2']);

      updateSettings({ className: ['class-1'] });

      expect(container.classList.contains('class-1')).toBe(true);
      expect(container.classList.contains('class-2')).toBe(false);
      expect(getCellMeta(0, 0).className).toEqual(['class-1']);
      expect(getCellMeta(0, 1).className).toEqual(['class-1']);
    });
  });
});
