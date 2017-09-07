describe('settings', function () {
  describe('fixedRowsBottom', function () {
    var id = 'testContainer';

    beforeEach(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function () {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('defined in constructor', function () {
      it('should show rows headers', function () {
        handsontable({
          fixedRowsBottom: 3
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(3);
      });

      it('should show rows headers when headers are enabled', function () {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('thead tr').length).toEqual(1);
        expect(getBottomClone().find('thead tr').height()).toEqual(0); // header is always invisible
        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });
    });

    describe('defined in updateSettings', function () {
      it('should increase fixed rows', function () {
        handsontable({
          fixedRowsBottom: 2
        });

        updateSettings({
          fixedRowsBottom: 4
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(4);
      });

      it('should decrease fixed rows', function () {
        handsontable({
          fixedRowsBottom: 4
        });

        updateSettings({
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });

      it('should create fixed rows when they are disabled eariler', function () {
        handsontable({
          fixedRowsBottom: 0
        });

        updateSettings({
          fixedRowsBottom: 2
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
      });

      it('should disable fixed rows', function () {
        handsontable({
          fixedRowsBottom: 2
        });

        updateSettings({
          fixedRowsBottom: 0
        });

        expect(getBottomClone().find('tbody tr').length).toEqual(2);
        expect(getLeftClone().height()).toBe(0);
      });

      it('should not throw errors while scrolling vertically when fixed rows was set', async () => {
        var spy = jasmine.createSpyObj('error', ['test']);
        var prevError = window.onerror;

        window.onerror = function(messageOrEvent, source, lineno, colno, error) {
          spy.test();
        };
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          width: 200,
          height: 200,
          rowHeaders: true,
        });

        updateSettings({
          fixedRowsBottom: 2
        });

        await sleep(100);

        hot.scrollViewportTo(30, 30);

        await sleep(100);

        expect(spy.test.calls.count()).toBe(0);
        window.onerror = prevError;
      });
    });
  });
});
