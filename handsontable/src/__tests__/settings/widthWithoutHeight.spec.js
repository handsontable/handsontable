describe('settings', () => {
  describe('width (without height)', () => {
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

    it('should respect width when height is not provided', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 30),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
      });

      expect($(hot.rootElement).width()).toBeAroundValue(200, 1);

      const holder = hot.rootElement.querySelector('.wtHolder');

      expect(holder).toBeDefined();
      // Width should constrain the grid. When height is omitted, the table should still clip
      // horizontally so it does not visually overflow its container (the reported regression).
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');
      expect(holder.getBoundingClientRect().width).toBeAroundValue(200, 1);
    });

    it('should treat `height: undefined` the same as omitting height', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 30),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
        height: undefined,
      });

      expect($(hot.rootElement).width()).toBeAroundValue(200, 1);

      const holder = hot.rootElement.querySelector('.wtHolder');

      expect(holder).toBeDefined();
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');
      expect(holder.getBoundingClientRect().width).toBeAroundValue(200, 1);
    });

    it('should not apply overflow clipping when `width` is `auto` and `height` is not provided', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 'auto',
      });

      const holder = hot.rootElement.querySelector('.wtHolder');

      expect(holder).toBeDefined();
      // `width: 'auto'` fills the container naturally — no horizontal overflow to clip.
      expect(window.getComputedStyle(hot.rootElement).overflowX).not.toBe('clip');
      // The table must be visible (non-zero dimensions).
      expect(hot.rootElement.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    it('should clip horizontally when `height` is reset with `null` alongside `width`', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 30),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
        height: 300,
      });

      await updateSettings({
        width: 200,
        height: null,
      });

      expect($(hot.rootElement).width()).toBeAroundValue(200, 1);
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');

      const holder = hot.rootElement.querySelector('.wtHolder');

      expect(holder).toBeDefined();
      expect(holder.getBoundingClientRect().width).toBeAroundValue(200, 1);
    });

    it('should clip horizontally when `beforeHeightChange` coerces height to `null`', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 30),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
        height: 300,
      });

      await updateSettings({
        width: 200,
        height: 400,
        beforeHeightChange() {
          return null;
        },
      });

      expect($(hot.rootElement).width()).toBeAroundValue(200, 1);
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');
    });

    it('should not leave a stale overflowX:clip after partial width update on a height-set table followed by height removal and width auto', async() => {
      // Regression guard: partial `updateSettings({ width })` when height is already set must
      // not add an explicit `overflow-x: clip` that outlives the height. If it does, the clip
      // persists even after height is removed and width becomes `auto`.
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
        height: 300,
      });

      await updateSettings({ width: 400 }); // partial: only width, height stays in HOT settings
      await updateSettings({ height: null }); // remove height
      await updateSettings({ width: 'auto' }); // auto width → no constrained boundary

      expect(window.getComputedStyle(hot.rootElement).overflowX).not.toBe('clip');
    });

    it('should clip when `height` is reset via partial `updateSettings` without changing `width`', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 30),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
        height: 300,
      });

      await updateSettings({ height: null });

      expect($(hot.rootElement).width()).toBeAroundValue(200, 1);
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');
    });

    it('should clear clip when `width` changes to `auto` on a table without height', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
      });

      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');

      await updateSettings({ width: 'auto' });

      expect(window.getComputedStyle(hot.rootElement).overflowX).not.toBe('clip');
    });

    it('should keep overflowX:clip through a width-only → height-added → height-removed cycle', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        width: 200,
      });

      // State C: width set, no height → clip must be active
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');

      // State A: add height → height block sets `overflow: clip` shorthand; our code must
      // not break that shorthand by unconditionally clearing overflow-x
      await updateSettings({ height: 300 });
      expect(hot.rootElement.style.overflow).toBe('clip');

      // State C again: remove height → overflowX:clip must be restored
      await updateSettings({ height: null });
      expect(window.getComputedStyle(hot.rootElement).overflowX).toBe('clip');
    });
  });
});

