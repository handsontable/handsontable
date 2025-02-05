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
      it('should show rows headers', () => {
        handsontable({
          fixedRowsTop: 3
        });

        expect(getTopClone().find('tbody tr').length).toEqual(3);
      });

      it('should show rows headers when headers are enabled', () => {
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
      it('should increase fixed rows', () => {
        handsontable({
          fixedRowsTop: 2
        });

        updateSettings({
          fixedRowsTop: 4
        });

        expect(getTopClone().find('tbody tr').length).toEqual(4);
      });

      it('should decrease fixed rows', () => {
        handsontable({
          fixedRowsTop: 4
        });

        updateSettings({
          fixedRowsTop: 2
        });

        expect(getTopClone().find('tbody tr').length).toEqual(2);
      });

      it('should create fixed rows when they are disabled eariler', () => {
        handsontable({
          fixedRowsTop: 0
        });

        updateSettings({
          fixedRowsTop: 2
        });

        expect(getTopClone().find('tbody tr').length).toEqual(2);
      });

      it('should disable fixed rows', () => {
        handsontable({
          fixedRowsTop: 2
        });

        updateSettings({
          fixedRowsTop: 0
        });

        expect(getTopClone().find('tbody tr').length).toBe(0);
        expect(getInlineStartClone().height()).toBe(0);
      });

      it('should not throw errors while scrolling vertically when fixed rows was set', (done) => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
        });

        updateSettings({
          fixedRowsTop: 2
        });

        setTimeout(() => {
          scrollViewportTo({
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
          fixedRowsTop: 2,
        });

        getMaster().find('.wtHolder').scrollLeft(100);

        await sleep(10);

        expect(getTopClone().find('.wtHolder').scrollLeft()).toBe(getMaster().find('.wtHolder').scrollLeft());
      });
    });

    it('should limit fixed rows to dataset rows length', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        fixedRowsTop: 3
      });

      expect(getTopClone().find('tbody tr').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(2, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(0, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(0);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(1, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(1);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(2, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(2);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(3);

      updateSettings({
        data: Handsontable.helper.createSpreadsheetData(4, 3),
      });

      expect(getTopClone().find('tbody tr').length).toBe(3);
    });

    it('should be possible to hide overlay when there are no headers enabled', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        fixedRowsTop: 2,
      });

      updateSettings({
        fixedRowsTop: 0,
      });

      hot.view.adjustElementsSize(); // this was causing a bug (#dev-678)

      expect(getTopClone().width()).toBe(0);
      expect(getTopClone().height()).toBe(0);
      expect(getTopClone().find('tbody tr').length).toBe(0);
    });

    it('should not render column header with doubled border after inserting a new row (#7065)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(0, 0),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsTop: 3,
      });

      alter('insert_row_above', 0);

      expect(getMaster().height()).forThemes(({ classic, main }) => {
        classic.toBe(50); // 25px corner + 25px added row
        main.toBe(59);
      });
      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(50);
        main.toBe(59);
      });
      expect(getTopInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(50);
        main.toBe(59);
      });
      expect(getInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(50);
        main.toBe(59);
      });
      expect(getBottomClone().height()).toBe(0);

      alter('insert_row_above', 0);

      expect(getMaster().height()).forThemes(({ classic, main }) => {
        classic.toBe(73);
        main.toBe(88);
      });
      expect(getTopClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(73);
        main.toBe(88);
      });
      expect(getTopInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(73);
        main.toBe(88);
      });
      expect(getInlineStartClone().height()).forThemes(({ classic, main }) => {
        classic.toBe(73);
        main.toBe(88);
      });
      expect(getBottomClone().height()).toBe(0);
    });
  });
});
