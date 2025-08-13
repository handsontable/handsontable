describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`getSelectedRangeActive` method', () => {
    it('should return undefined if there is no selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      expect(getSelectedRangeActive()).toBeUndefined();
    });

    it('should return correct active range for single selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      await selectCell(1, 2);

      expect(getSelectedRangeActive()).toEqualCellRange('highlight: 1,2 from: 1,2 to: 1,2');
    });

    it('should return correct active range for multiple selections layers', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      await selectCells([
        [1, 2, 2, 3],
        [3, 4, 3, 6],
        [5, 6, 7, 8],
      ]);

      expect(getSelectedRangeActive()).toEqualCellRange('highlight: 5,6 from: 5,6 to: 7,8');

      selection().setRangeFocus(cellCoords(2, 2), 0);

      expect(getSelectedRangeActive()).toEqualCellRange('highlight: 2,2 from: 1,2 to: 2,3');

      selection().setRangeFocus(cellCoords(3, 6), 1);

      expect(getSelectedRangeActive()).toEqualCellRange('highlight: 3,6 from: 3,4 to: 3,6');
    });
  });
});
