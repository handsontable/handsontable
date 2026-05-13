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
    it('should be fired with proper arguments', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectRows = jasmine.createSpy('afterSelectRows');

      addHook('afterSelectRows', afterSelectRows);
      await selectRows(2, 4);

      expect(afterSelectRows).toHaveBeenCalledTimes(1);
      expect(afterSelectRows).toHaveBeenCalledWith(
        cellCoords(2, -1),
        cellCoords(4, 9),
        cellCoords(2, 0),
      );
    });

    it('should be fired after the `beforeSelectRows` hook', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectRows = jasmine.createSpy('beforeSelectRows');
      const afterSelectRows = jasmine.createSpy('afterSelectRows');

      addHook('beforeSelectRows', beforeSelectRows);
      addHook('afterSelectRows', afterSelectRows);
      await selectRows(2, 4);

      expect(beforeSelectRows).toHaveBeenCalledBefore(afterSelectRows);
    });
  });
});
