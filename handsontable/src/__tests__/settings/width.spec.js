describe('settings', () => {
  describe('width', () => {
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

    it('should update the table width', async() => {
      const hot = handsontable({
        startRows: 5,
        startCols: 10,
      });

      const initialWidth = $(hot.rootElement).width();

      await updateSettings({
        width: 300
      });

      expect($(hot.rootElement).width()).toBe(300);
      expect($(hot.rootElement).width()).not.toBe(initialWidth);
    });

    it('should update the table width after setting the new value as "auto"', async() => {
      const hot = handsontable({
        startRows: 5,
        startCols: 15,
        width: 200,
        height: 100,
      });

      const initialWidth = $(hot.rootElement).width();

      await updateSettings({
        width: 'auto'
      });

      expect(hot.rootElement.style.width).toBe('auto');
      expect($(hot.rootElement).width()).not.toBe(initialWidth);
    });

    it('should allow width to be a string', async() => {
      handsontable({
        startRows: 10,
        startCols: 10,
        height: '50vh',
      });

      expect(spec().$container.height()).toBe(Math.ceil(window.innerHeight / 2));
    });

    it('should allow width to be a number', async() => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 107,
      });

      expect($(hot.rootElement).width()).toBe(107);
    });

    it('should allow width to be a function', async() => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width() {
          return 107;
        }
      });

      expect($(hot.rootElement).width()).toBe(107);
    });

    it('should allow width to be a string', async() => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: '50%',
      });

      const parentWidth = spec().$container.parent().width();

      expect($(hot.rootElement).width()).toBeAroundValue(parentWidth * 0.5, 0.5);
    });

    it('should respect width provided in inline style', async() => {
      spec().$container.css({
        overflow: 'auto',
        width: '200px'
      });
      const hot = handsontable({
        data: [
          ['ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC']
        ]
      });

      expect($(hot.rootElement).width()).toBe(200);
    });

    it('should respect width provided in CSS class', async() => {
      $('<style>.myTable {overflow: auto; width: 200px}</style>').appendTo('head');
      spec().$container.addClass('myTable');
      const hot = handsontable({
        data: [
          ['ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC']
        ]
      });

      expect($(hot.rootElement).width()).toBe(200);
    });

    describe('for columns', () => {
      it('should set the width correctly after changes made during updateSettings', async() => {
        handsontable({
          startRows: 2,
          fixedColumnsStart: 2,
          columns: [{
            width: 50
          }, {
            width: 80
          }, {
            width: 110
          }, {
            width: 140
          }, {
            width: 30
          }, {
            width: 30
          }, {
            width: 30
          }]
        });

        const leftClone = spec().$container.find('.ht_clone_inline_start');

        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(80);

        await updateSettings({
          manualColumnMove: [2, 0, 1],
          fixedColumnsStart: 1
        });

        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
        expect(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0]).toBe(undefined);

        await updateSettings({
          manualColumnMove: false,
          fixedColumnsStart: 2
        });

        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(50);
      });

      it('should set the width correctly after changes made during updateSettings when columns are a function', async() => {
        handsontable({
          startCols: 7,
          startRows: 2,
          fixedColumnsStart: 2,
          columns(column) {
            let colMeta = {};

            if (column === 0) {
              colMeta.width = 50;

            } else if (column === 1) {
              colMeta.width = 80;

            } else if (column === 2) {
              colMeta.width = 110;

            } else if (column === 3) {
              colMeta.width = 140;

            } else if ([4, 5, 6].indexOf(column) > -1) {
              colMeta.width = 30;

            } else {
              colMeta = null;
            }

            return colMeta;
          }
        });

        const leftClone = spec().$container.find('.ht_clone_inline_start');

        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(80);

        await updateSettings({
          manualColumnMove: [2, 0, 1],
          fixedColumnsStart: 1
        });

        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
        expect(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0]).toBe(undefined);

        await updateSettings({
          manualColumnMove: false,
          fixedColumnsStart: 2
        });

        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
        expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(50);
      });
    });

    describe('when height is not provided', () => {
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

      it('should preserve a user-defined `overflow` restored from the initial style instead of clipping the X axis', async() => {
        // When the root element carried an inline `overflow` (no `height`) at init, resetting
        // `height` with `null` restores that initial style. The width clip must not stomp the X
        // axis: `overflow: hidden` creates a block formatting context and allows programmatic
        // scroll, while `clip` does neither.
        const hot = handsontable({
          data: createSpreadsheetData(100, 30),
          rowHeaders: true,
          colHeaders: true,
          width: 200,
          height: 300,
        });

        // Simulate a root element whose initial inline style defined `overflow` but no `height`
        // (the state the `height: null` restore branch reads from).
        hot.rootElement.setAttribute('data-initialstyle', 'overflow: hidden;');

        await updateSettings({
          width: 200,
          height: null,
        });

        expect($(hot.rootElement).width()).toBeAroundValue(200, 1);
        // The restored `overflow: hidden` declaration must stay intact, not be rewritten to
        // `clip hidden` by the width-clip block.
        expect(hot.rootElement.style.overflow).toBe('hidden');
        expect(hot.rootElement.style.overflowX).toBe('hidden');
      });
    });
  });
});
