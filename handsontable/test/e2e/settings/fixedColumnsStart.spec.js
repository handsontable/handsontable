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
      it('should show columns headers', async() => {
        handsontable({
          fixedColumnsStart: 3
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

      it('should show columns headers when headers are enabled', async() => {
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
      it('should increase fixed columns', async() => {
        handsontable({
          fixedColumnsStart: 2
        });

        await updateSettings({
          fixedColumnsStart: 4
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });

      it('should decrease fixed columns', async() => {
        handsontable({
          fixedColumnsStart: 4
        });

        await updateSettings({
          fixedColumnsStart: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should create fixed columns when they are disabled eariler', async() => {
        handsontable({
          fixedColumnsStart: 0
        });

        await updateSettings({
          fixedColumnsStart: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should disable fixed columns', async() => {
        handsontable({
          fixedColumnsStart: 2
        });

        await updateSettings({
          fixedColumnsStart: 0
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);
        expect(getInlineStartClone().width()).toBe(0);
      });

      it('should not throw errors while scrolling horizontally when fixed columns was set', async() => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };

        handsontable({
          data: createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          colHeaders: true,
        });

        await updateSettings({
          fixedColumnsStart: 2
        });

        await sleep(100);
        await scrollViewportTo({
          row: 30,
          col: 30,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        expect(spy.test.calls.count()).toBe(0);

        window.onerror = prevError;
      });

      it('should synchronize scroll with master table', async() => {
        handsontable({
          data: createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
          fixedColumnsStart: 2,
        });

        await scrollViewportVertically(100);

        expect(getInlineStartClone().find('.wtHolder').scrollTop()).toBe(getMaster().find('.wtHolder').scrollTop());
      });
    });

    it('should limit fixed columns to dataset columns length', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        fixedColumnsStart: 3
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(3, 0),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);

      await updateSettings({
        data: createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(3, 3),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(3, 4),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);
    });

    it('should be possible to hide overlay when there are no headers enabled', async() => {
      handsontable({
        colHeaders: false,
        rowHeaders: false,
        fixedColumnsStart: 2,
      });

      await updateSettings({
        fixedColumnsStart: 0,
      });

      tableView().adjustElementsSize(); // this was causing a bug (#dev-678)

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
      it('should show columns headers', async() => {
        handsontable({
          fixedColumnsLeft: 3
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(3);
      });

      it('should show columns headers when headers are enabled', async() => {
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
      it('should increase fixed columns', async() => {
        handsontable({
          fixedColumnsLeft: 2
        });

        await updateSettings({
          fixedColumnsLeft: 4
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(4);
      });

      it('should decrease fixed columns', async() => {
        handsontable({
          fixedColumnsLeft: 4
        });

        await updateSettings({
          fixedColumnsLeft: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should create fixed columns when they are disabled eariler', async() => {
        handsontable({
          fixedColumnsLeft: 0
        });

        await updateSettings({
          fixedColumnsLeft: 2
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toEqual(2);
      });

      it('should disable fixed columns', async() => {
        handsontable({
          fixedColumnsLeft: 2
        });

        await updateSettings({
          fixedColumnsLeft: 0
        });

        expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);
        expect(getInlineStartClone().width()).toBe(0);
      });

      it('should not throw errors while scrolling horizontally when fixed columns was set', async() => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };

        handsontable({
          data: createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          colHeaders: true,
        });

        await updateSettings({
          fixedColumnsLeft: 2
        });

        await sleep(100);
        await scrollViewportTo({
          row: 30,
          col: 30,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        expect(spy.test.calls.count()).toBe(0);

        window.onerror = prevError;
      });

      it('should synchronize scroll with master table', async() => {
        handsontable({
          data: createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
          fixedColumnsLeft: 2,
        });

        await scrollViewportVertically(100);

        expect(getInlineStartClone().find('.wtHolder').scrollTop()).toBe(getMaster().find('.wtHolder').scrollTop());
      });
    });

    it('should limit fixed columns to dataset columns length', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        fixedColumnsLeft: 3
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(3, 0),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(0);

      await updateSettings({
        data: createSpreadsheetData(3, 1),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(3, 2),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(3, 3),
      });

      expect(getInlineStartClone().find('tbody tr:eq(0) td').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(3, 4),
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

    it('constructor should throw Error', async() => {
      expect(() => handsontable({
        fixedColumnsLeft: 3
      })).toThrowError('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');

      $('body').find('.ht-portal').remove();
    });

    it('updateSettings should throw Error', async() => {
      handsontable();

      expect(() => {
        // eslint-disable-next-line handsontable/require-await
        updateSettings({
          fixedColumnsLeft: 4
        });
      }).toThrowError('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
      $('body').find('.ht-portal').remove();
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

    it('defined both in constructor should thrown an error', async() => {
      expect(() => handsontable(
        {
          fixedColumnsStart: 3,
          fixedColumnsLeft: 1
        }
      )).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.'
        + ' Please use only the option `fixedColumnsStart`.');

      $('body').find('.ht-portal').remove();
    });

    it('defined `fixedColumnsLeft` in constructor, `fixedColumnsStart` in updateSettings should thrown an error', async() => {
      handsontable({
        fixedColumnsLeft: 2
      });

      expect(() => {
        // eslint-disable-next-line handsontable/require-await
        updateSettings({
          fixedColumnsStart: 4
        });
      }).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.'
        + ' Please use only the option `fixedColumnsStart`.');
    });

    it('defined `fixedColumnsStart` in constructor, `fixedColumnsLeft` in updateSettings should thrown an error', async() => {
      handsontable({
        fixedColumnsStart: 2
      });

      expect(() => {
        // eslint-disable-next-line handsontable/require-await
        updateSettings({
          fixedColumnsLeft: 4
        });
      }).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.'
        + ' Please use only the option `fixedColumnsStart`.');
    });

    it('defined both in updateSettings should thrown an error ', async() => {
      handsontable({});

      expect(() => {
        // eslint-disable-next-line handsontable/require-await
        updateSettings({
          fixedColumnsStart: 4,
          fixedColumnsLeft: 3
        });
      }).toThrowError('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together. '
        + 'Please use only the option `fixedColumnsStart`.');
    });
  });
});
