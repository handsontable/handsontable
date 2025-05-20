describe('settings', () => {
  describe('fixedRowsTop', () => {
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
      it('should show rows headers', async() => {
        handsontable({
          fixedRowsTop: 3
        });

        expect(getTopClone().find('tbody tr').length).toEqual(3);
      });

      it('should show rows headers when headers are enabled', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2
        });

        expect(getTopClone().find('thead tr').length).toEqual(1);
        expect(getTopClone().find('tbody tr').length).toEqual(2);
      });
    });

    describe('defined in updateSettings', () => {
      it('should increase fixed rows', async() => {
        handsontable({
          fixedRowsTop: 2
        });

        await updateSettings({
          fixedRowsTop: 4
        });

        expect(getTopClone().find('tbody tr').length).toEqual(4);
      });

      it('should decrease fixed rows', async() => {
        handsontable({
          fixedRowsTop: 4
        });

        await updateSettings({
          fixedRowsTop: 2
        });

        expect(getTopClone().find('tbody tr').length).toEqual(2);
      });

      it('should create fixed rows when they are disabled eariler', async() => {
        handsontable({
          fixedRowsTop: 0
        });

        await updateSettings({
          fixedRowsTop: 2
        });

        expect(getTopClone().find('tbody tr').length).toEqual(2);
      });

      it('should disable fixed rows', async() => {
        handsontable({
          fixedRowsTop: 2
        });

        await updateSettings({
          fixedRowsTop: 0
        });

        expect(getTopClone().find('tbody tr').length).toBe(0);
        expect(getInlineStartClone().height()).toBe(0);
      });

      it('should not throw errors while scrolling vertically when fixed rows was set', async() => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };
        handsontable({
          data: createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
        });

        await updateSettings({
          fixedRowsTop: 2
        });

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
          fixedRowsTop: 2,
        });

        await scrollViewportHorizontally(100);

        expect(getTopClone().find('.wtHolder').scrollLeft()).toBe(getMaster().find('.wtHolder').scrollLeft());
      });
    });

    it('should limit fixed rows to dataset rows length', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        fixedRowsTop: 3
      });

      expect(getTopClone().find('tbody tr').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(2, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(1, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(0, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(0);

      await updateSettings({
        data: createSpreadsheetData(1, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(1);

      await updateSettings({
        data: createSpreadsheetData(2, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(2);

      await updateSettings({
        data: createSpreadsheetData(3, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(3);

      await updateSettings({
        data: createSpreadsheetData(4, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(3);
    });

    it('should be possible to hide overlay when there are no headers enabled', async() => {
      handsontable({
        colHeaders: false,
        rowHeaders: false,
        fixedRowsTop: 2,
      });

      await updateSettings({
        fixedRowsTop: 0,
      });

      tableView().adjustElementsSize(); // this was causing a bug (#dev-678)

      expect(getTopClone().width()).toBe(0);
      expect(getTopClone().height()).toBe(0);
      expect(getTopClone().find('tbody tr').length).toBe(0);
    });

    it('should not render column header with doubled border after inserting a new row (#7065)', async() => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsTop: 3,
      });

      await alter('insert_row_above', 0);

      expect(getMaster().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50); // 25px corner + 25px added row
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getTopInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getBottomClone().height()).toBe(0);

      await alter('insert_row_above', 0);

      expect(getMaster().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(73);
        main.toBe(88);
        horizon.toBe(112);
      });
      expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(73);
        main.toBe(88);
        horizon.toBe(112);
      });
      expect(getTopInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(73);
        main.toBe(88);
        horizon.toBe(112);
      });
      expect(getInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(73);
        main.toBe(88);
        horizon.toBe(112);
      });
      expect(getBottomClone().height()).toBe(0);
    });
  });
});
