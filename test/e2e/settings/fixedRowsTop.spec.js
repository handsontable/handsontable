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

        expect(getTopClone().find('tbody tr').length).toEqual(2);
        expect(getLeftClone().height()).toBe(0);
      });

      it('should not throw errors while scrolling vertically when fixed rows was set', (done) => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();
        };
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
        });

        updateSettings({
          fixedRowsTop: 2
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
    });
  });
});
