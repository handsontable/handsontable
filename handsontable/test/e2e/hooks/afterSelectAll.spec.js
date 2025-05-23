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

  describe('afterSelectAll', () => {
    it('should be fired with proper arguments', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectAll = jasmine.createSpy('afterSelectAll');

      addHook('afterSelectAll', afterSelectAll);
      await selectAll();

      expect(afterSelectAll).toHaveBeenCalledTimes(1);
      expect(afterSelectAll).toHaveBeenCalledWith(
        cellCoords(-1, -1),
        cellCoords(9, 9),
      );
    });

    it('should be fired before `afterSelectAll` hook', async() => {
      const beforeSelectAll = jasmine.createSpy('beforeSelectAll');
      const afterSelectAll = jasmine.createSpy('afterSelectAll');

      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectAll,
        afterSelectAll,
      });

      await selectAll();

      expect(beforeSelectAll).toHaveBeenCalledBefore(afterSelectAll);
    });
  });
});
