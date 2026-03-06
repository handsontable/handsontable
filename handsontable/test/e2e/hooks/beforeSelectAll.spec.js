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

  describe('beforeSelectAll', () => {
    it('should be fired with proper arguments', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectAll = jasmine.createSpy('beforeSelectAll');

      addHook('beforeSelectAll', beforeSelectAll);
      await selectAll();

      expect(beforeSelectAll).toHaveBeenCalledTimes(1);
      expect(beforeSelectAll).toHaveBeenCalledWith(
        cellCoords(-1, -1),
        cellCoords(9, 9),
      );
    });

    it('should be possible to modify range and change the position of the focus selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectAll(from, to, highlight) {
          from.row = from.row - 1;
          to.row = to.row + 2;
          highlight.row = 2;
          highlight.col = 3;
        }
      });

      await selectCell(1, 1);
      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -2,-1 to: 11,9']);
    });
  });
});
