describe('settings', () => {
  describe('fixedColumnsLeft', () => {
    var id = 'testContainer';

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
        var spy = jasmine.createSpyObj('error', ['test']);
        var prevError = window.onerror;

        window.onerror = function(messageOrEvent, source, lineno, colno, error) {
          spy.test();
        };
        var hot = handsontable({
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
    });
  });
});
