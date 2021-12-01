xdescribe('settings', () => {
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

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

      it('should show columns headers when headers are enabled', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedColumnsStart: 2
        });

        expect(getLeftClone().find('thead tr th').length).toEqual(3);
        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
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

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });

      it('should decrease fixed columns', () => {
        handsontable({
          fixedColumnsStart: 4
        });

        updateSettings({
          fixedColumnsStart: 2
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should create fixed columns when they are disabled eariler', () => {
        handsontable({
          fixedColumnsStart: 0
        });

        updateSettings({
          fixedColumnsStart: 2
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should disable fixed columns', () => {
        handsontable({
          fixedColumnsStart: 2
        });

        updateSettings({
          fixedColumnsStart: 0
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
        expect(getLeftClone().width()).toBe(0);
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
          hot.scrollViewportTo(30, 30);
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

        expect(getLeftClone().find('.wtHolder').scrollTop()).toBe(getMaster().find('.wtHolder').scrollTop());
      });
    });

    it('should limit fixed columns to dataset columns length', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        fixedColumnsStart: 3
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 0),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(0);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 4),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(3);
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

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

      it('should show columns headers when headers are enabled', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedColumnsLeft: 2
        });

        expect(getLeftClone().find('thead tr th').length).toEqual(3);
        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
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

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });

      it('should decrease fixed columns', () => {
        handsontable({
          fixedColumnsLeft: 4
        });

        updateSettings({
          fixedColumnsLeft: 2
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should create fixed columns when they are disabled eariler', () => {
        handsontable({
          fixedColumnsLeft: 0
        });

        updateSettings({
          fixedColumnsLeft: 2
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should disable fixed columns', () => {
        handsontable({
          fixedColumnsLeft: 2
        });

        updateSettings({
          fixedColumnsLeft: 0
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(2);
        expect(getLeftClone().width()).toBe(0);
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
          hot.scrollViewportTo(30, 30);
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

        expect(getLeftClone().find('.wtHolder').scrollTop()).toBe(getMaster().find('.wtHolder').scrollTop());
      });
    });

    it('should limit fixed columns to dataset columns length', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        fixedColumnsLeft: 3
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 0),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(0);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 1),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 2),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 4),
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toBe(3);
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

    xit('constructor should throw Error', () => { // todo causes another tests to crash
      expect(() => handsontable({
        fixedColumnsLeft: 3
      })).toThrow();
    });

    xit('updateSettings should throw Error', () => { // todo causes another tests to crash
      handsontable();

      expect(() => updateSettings({
        fixedColumnsLeft: 4
      })).toThrow();
    });
  });
  xdescribe('fixedColumnsLeft with fixedColumnsStart', () => { // todo should throw errors
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
      it('should prefer `fixedColumnsStart` to show fixed columns', () => {
        handsontable({
          fixedColumnsStart: 3,
          fixedColumnsLeft: 1
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

    });

    describe('defined in updateSettings', () => {
      it('should increase fixed columns (init with alias, update with final)', () => {
        handsontable({
          fixedColumnsLeft: 2
        });

        updateSettings({
          fixedColumnsStart: 4
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });
      it('should increase fixed columns (init with final, update with alias)', () => {
        handsontable({
          fixedColumnsStart: 2
        });

        updateSettings({
          fixedColumnsLeft: 4
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });
      it('should increase fixed columns (init with final, update with both: prefer final)', () => {
        handsontable({
          fixedColumnsStart: 2
        });

        updateSettings({
          fixedColumnsStart: 4,
          fixedColumnsLeft: 3
        });

        expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });
    });
  });
});
