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

  describe('`getActiveSelectionLayerIndex` method', () => {
    it('should return `0` if there is no selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      expect(getActiveSelectionLayerIndex()).toBe(0);
    });

    it('should return correct layer index for single selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      await selectCell(1, 2);

      expect(getActiveSelectionLayerIndex()).toBe(0);
    });

    it('should return correct layer index for multiple selections layers', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      await selectCells([
        [1, 2, 2, 3],
        [3, 4, 3, 6],
        [5, 6, 7, 8],
      ]);

      expect(getActiveSelectionLayerIndex()).toBe(2);
    });
  });
});
