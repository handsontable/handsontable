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

  describe('afterSelectColumns', () => {
    it('should be fired with proper arguments', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectColumns = jasmine.createSpy('afterSelectColumns');

      addHook('afterSelectColumns', afterSelectColumns);
      selectColumns(2, 4);

      expect(afterSelectColumns).toHaveBeenCalledTimes(1);
      expect(afterSelectColumns).toHaveBeenCalledWith(
        hot._createCellCoords(-1, 2),
        hot._createCellCoords(9, 4),
        hot._createCellCoords(0, 2),
      );
    });

    it('should be fired after the `beforeSelectColumns` hook', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectColumns = jasmine.createSpy('beforeSelectColumns');
      const afterSelectColumns = jasmine.createSpy('afterSelectColumns');

      addHook('beforeSelectColumns', beforeSelectColumns);
      addHook('afterSelectColumns', afterSelectColumns);
      selectColumns(2, 4);

      expect(beforeSelectColumns).toHaveBeenCalledBefore(afterSelectColumns);
    });
  });
});
