describe('Hook', () => {
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

  describe('afterGetColHeader', () => {
    it('should be fired for all displayed columns on init', () => {
      const afterGetColHeader = jasmine.createSpy('afterGetColHeader');

      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        autoRowSize: false,
        autoColumnSize: false,
        afterGetColHeader,
      });

      expect(afterGetColHeader.calls.count()).toBe(10);

      const calls = afterGetColHeader.calls;

      // initial render
      expect(calls.argsFor(0)).toEqual([0, getCell(-1, 0), 0]);
      expect(calls.argsFor(1)).toEqual([1, getCell(-1, 1), 0]);
      expect(calls.argsFor(2)).toEqual([2, getCell(-1, 2), 0]);
      expect(calls.argsFor(3)).toEqual([3, getCell(-1, 3), 0]);
      expect(calls.argsFor(4)).toEqual([4, getCell(-1, 4), 0]);

      // the second render triggered by some other module
      expect(calls.argsFor(5)).toEqual([0, getCell(-1, 0), 0]);
      expect(calls.argsFor(6)).toEqual([1, getCell(-1, 1), 0]);
      expect(calls.argsFor(7)).toEqual([2, getCell(-1, 2), 0]);
      expect(calls.argsFor(8)).toEqual([3, getCell(-1, 3), 0]);
      expect(calls.argsFor(9)).toEqual([4, getCell(-1, 4), 0]);
    });
  });
});
