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

  describe('beforeSelectRows', () => {
    it('should be fired with proper arguments', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectRows = jasmine.createSpy('beforeSelectRows');

      addHook('beforeSelectRows', beforeSelectRows);
      await selectRows(2, 4);

      expect(beforeSelectRows).toHaveBeenCalledTimes(1);
      expect(beforeSelectRows).toHaveBeenCalledWith(
        cellCoords(2, -1),
        cellCoords(4, 9),
        cellCoords(2, 0),
      );
    });

    it('should be possible to modify rows range and change the position of the focus selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectRows(from, to, highlight) {
          from.row = from.row - 1;
          to.row = to.row + 2;
          highlight.row = 2;
          highlight.col = 1;
        }
      });

      await selectRows(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,-1 to: 6,9']);
    });

    it('should be possible to modify rows range in columns selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectRows(from, to) {
          from.col = from.col - 1;
          to.col = to.col + 2;
        }
      });

      await selectRows(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-2 to: 4,11']);
    });
  });
});
