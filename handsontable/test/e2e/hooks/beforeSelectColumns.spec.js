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

  describe('beforeSelectColumns', () => {
    it('should be fired with proper arguments', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectColumns = jasmine.createSpy('beforeSelectColumns');

      addHook('beforeSelectColumns', beforeSelectColumns);
      await selectColumns(2, 4);

      expect(beforeSelectColumns).toHaveBeenCalledTimes(1);
      expect(beforeSelectColumns).toHaveBeenCalledWith(
        cellCoords(-1, 2),
        cellCoords(9, 4),
        cellCoords(0, 2),
      );
    });

    it('should be possible to modify columns range and change the position of the focus selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectColumns(from, to, highlight) {
          from.col = from.col - 1;
          to.col = to.col + 2;
          highlight.row = 1;
          highlight.col = 2;
        }
      });

      await selectColumns(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -1,1 to: 9,6']);
    });

    it('should be possible to modify rows range in columns selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectColumns(from, to) {
          from.row = from.row - 1;
          to.row = to.row + 2;
        }
      });

      await selectColumns(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -2,2 to: 11,4']);
    });
  });
});
