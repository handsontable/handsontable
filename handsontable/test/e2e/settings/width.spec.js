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
  });
});
