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
    it('should be fired with proper arguments', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectRows = jasmine.createSpy('beforeSelectRows');

      addHook('beforeSelectRows', beforeSelectRows);
      selectRows(2, 4);

      expect(beforeSelectRows).toHaveBeenCalledTimes(1);
      expect(beforeSelectRows).toHaveBeenCalledWith(
        hot._createCellCoords(2, -1),
        hot._createCellCoords(4, 9),
        hot._createCellCoords(2, 0),
      );
    });

    it('should be possible to modify rows range and change the position of the focus selection', () => {
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

      selectRows(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,-1 to: 6,9']);
    });

    it('should not be possible to modify rows range in columns selection', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectRows(from, to) {
          from.col = from.col - 1;
          to.col = to.col + 2;
        }
      });

      selectRows(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-1 to: 4,9']);
    });
  });
});
