describe('settings', () => {
  describe('fixedColumnsStart', () => {
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

    describe('defined in constructor', () => {
      it('should show columns headers', () => {
        handsontable({
          fixedColumnsStart: 3
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

      it('should show columns headers when headers are enabled', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedColumnsStart: 2
        });

        expect(getInlineStartClone().find('thead tr th').length).toEqual(3);
        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });
    });

    describe('defined in updateSettings', () => {
      it('should increase fixed columns', () => {
        handsontable({
          fixedColumnsStart: 2
        });

        updateSettings({
          fixedColumnsStart: 4
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });

      it('should decrease fixed columns', () => {
        handsontable({
          fixedColumnsStart: 4
        });

        updateSettings({
          fixedColumnsStart: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should create fixed columns when they are disabled eariler', () => {
        handsontable({
          fixedColumnsStart: 0
        });

        updateSettings({
          fixedColumnsStart: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should disable fixed columns', () => {
        handsontable({
          fixedColumnsStart: 2
        });

        updateSettings({
          fixedColumnsStart: 0
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);
        expect(getInlineStartClone().width()).toBe(0);
      });

      it('should not throw errors while scrolling horizontally when fixed columns was set', (done) => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          colHeaders: true,
        });

        updateSettings({
          fixedColumnsStart: 2
        });

        setTimeout(() => {
          hot.scrollViewportTo({
            row: 30,
            col: 30,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
        }, 100);

        setTimeout(() => {
          expect(spy.test.calls.count()).toBe(0);

          done();
          window.onerror = prevError;
        }, 200);
      });

      it('should synchronize scroll with master table', async() => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
          fixedColumnsStart: 2,
        });

        getMaster().find('.wtHolder').scrollTop(100);

        await sleep(10);

        expect(getInlineStartClone().find('.wtHolder').scrollTop()).toBe(getMaster().find('.wtHolder').scrollTop());
      });
    });

    it('should limit fixed columns to dataset columns length', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        fixedColumnsStart: 3
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 0),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 4),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);
    });

    it('should be possible to hide overlay when there are no headers enabled', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        fixedColumnsStart: 2,
      });

      updateSettings({
        fixedColumnsStart: 0,
      });

      hot.view.adjustElementsSize(); // this was causing a bug (#dev-678)

      expect(getInlineStartClone().width()).toBe(0);
      expect(getInlineStartClone().height()).toBe(0);
      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);
    });
  });

  describe('fixedColumnsLeft', () => {
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

    describe('defined in constructor', () => {
      it('should show columns headers', () => {
        handsontable({
          fixedColumnsLeft: 3
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

      it('should show columns headers when headers are enabled', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedColumnsLeft: 2
        });

        expect(getInlineStartClone().find('thead tr th').length).toEqual(3);
        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });
    });

    describe('defined in updateSettings', () => {
      it('should increase fixed columns', () => {
        handsontable({
          fixedColumnsLeft: 2
        });

        updateSettings({
          fixedColumnsLeft: 4
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });

      it('should decrease fixed columns', () => {
        handsontable({
          fixedColumnsLeft: 4
        });

        updateSettings({
          fixedColumnsLeft: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should create fixed columns when they are disabled eariler', () => {
        handsontable({
          fixedColumnsLeft: 0
        });

        updateSettings({
          fixedColumnsLeft: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should disable fixed columns', () => {
        handsontable({
          fixedColumnsLeft: 2
        });

        updateSettings({
          fixedColumnsLeft: 0
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);
        expect(getInlineStartClone().width()).toBe(0);
      });

      it('should not throw errors while scrolling horizontally when fixed columns was set', (done) => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          colHeaders: true,
        });

        updateSettings({
          fixedColumnsLeft: 2
        });

        setTimeout(() => {
          hot.scrollViewportTo({
            row: 30,
            col: 30,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
        }, 100);

        setTimeout(() => {
          expect(spy.test.calls.count()).toBe(0);

          done();
          window.onerror = prevError;
        }, 200);
      });

      it('should synchronize scroll with master table', async() => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
          fixedColumnsLeft: 2,
        });

        getMaster().find('.wtHolder').scrollTop(100);

        await sleep(10);

        expect(getInlineStartClone().find('.wtHolder').scrollTop()).toBe(getMaster().find('.wtHolder').scrollTop());
      });
    });

    it('should limit fixed columns to dataset columns length', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        fixedColumnsLeft: 3
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 0),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 4),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);
    });
  });

  describe('fixedColumnsLeft with RTL', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div dir="rtl" id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('constructor should throw Error', () => {
      expect(() => handsontable({
        fixedColumnsLeft: 3
      })).toThrowError('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
    });

    it('updateSettings should throw Error', () => {
      handsontable();

      expect(() => updateSettings({
        fixedColumnsLeft: 4
      })).toThrowError('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
    });
  });

  describe('fixedColumnsLeft with fixedColumnsStart', () => {
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

    it('defined both in constructor should thrown an error', () => {
      expect(() => handsontable(
        {
          fixedColumnsStart: 3,
          fixedColumnsLeft: 1
        }
      )).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.'
        + ' Please use only the option `fixedColumnsStart`.');
    });

    it('defined `fixedColumnsLeft` in constructor, `fixedColumnsStart` in updateSettings should thrown an error', () => {
      handsontable({
        fixedColumnsLeft: 2
      });

      expect(() => updateSettings({
        fixedColumnsStart: 4
      })).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.'
        + ' Please use only the option `fixedColumnsStart`.');
    });

    it('defined `fixedColumnsStart` in constructor, `fixedColumnsLeft` in updateSettings should thrown an error', () => {
      handsontable({
        fixedColumnsStart: 2
      });

      expect(() => updateSettings({
        fixedColumnsLeft: 4
      })).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.'
        + ' Please use only the option `fixedColumnsStart`.');
    });

    it('defined both in updateSettings should thrown an error ', () => {
      handsontable({});

      expect(() => updateSettings({
        fixedColumnsStart: 4,
        fixedColumnsLeft: 3
      })).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together. '
        + 'Please use only the option `fixedColumnsStart`.');
    });
  });
});
