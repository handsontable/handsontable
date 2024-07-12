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

  describe('afterSelectRows', () => {
    it('should be fired with proper arguments', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectRows = jasmine.createSpy('afterSelectRows');

      addHook('afterSelectRows', afterSelectRows);
      selectRows(2, 4);

      expect(afterSelectRows).toHaveBeenCalledTimes(1);
      expect(afterSelectRows).toHaveBeenCalledWith(
        hot._createCellCoords(2, -1),
        hot._createCellCoords(4, 9),
        hot._createCellCoords(2, 0),
      );
    });

    it('should be fired after the `beforeSelectRows` hook', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectRows = jasmine.createSpy('beforeSelectRows');
      const afterSelectRows = jasmine.createSpy('afterSelectRows');

      addHook('beforeSelectRows', beforeSelectRows);
      addHook('afterSelectRows', afterSelectRows);
      selectRows(2, 4);

      expect(beforeSelectRows).toHaveBeenCalledBefore(afterSelectRows);
    });
  });
});
