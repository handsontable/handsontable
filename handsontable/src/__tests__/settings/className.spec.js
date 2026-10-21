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

    it('should add the className to a cell whose renderer calls no built-in renderer', async() => {
      handsontable({
        data: [['a1', 'b1']],
        className: 'class-1',
        columns: [
          {},
          {
            renderer(instance, td, row, col, prop, value) {
              td.textContent = `${value}`;
            },
          },
        ],
      });

      // The custom renderer never chains a built-in renderer. Handsontable runs `baseRenderer`
      // afterwards, so both cells carry the class name.
      expect(getCell(0, 0).classList.contains('class-1')).toBe(true);
      expect(getCell(0, 1).classList.contains('class-1')).toBe(true);
    });

    it('should keep the className on the container when the cells clear it', async() => {
      const hot = handsontable({
        data: [['a1', 'b1']],
        className: 'class-1',
        cells() {
          return { className: '' };
        },
      });

      expect(hot.rootElement.classList.contains('class-1')).toBe(true);
      expect(getCell(0, 0).classList.contains('class-1')).toBe(false);
      expect(getCell(0, 1).classList.contains('class-1')).toBe(false);
    });
  });
});
