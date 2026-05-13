describe('settings', () => {
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

  describe('viewportRowRenderingOffset', () => {
    it('should be possible to change the size of the calculated rendered rows', async() => {
      let calculator;

      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 125,
        height: 125,
        viewportRowRenderingOffset: 0,
        afterViewportRowCalculatorOverride(calculatorInstance) {
          calculator = calculatorInstance;
        },
      });

      await selectCell(25, 25);

      // Capture the base rendered range with offset 0
      const baseStartRow = calculator.startRow;
      const baseEndRow = calculator.endRow;

      await updateSettings({ viewportRowRenderingOffset: 10 });

      // With offset 10, the rendered range expands by 10 rows on each side
      expect(calculator.startRow).toBe(baseStartRow - 10);
      expect(calculator.endRow).toBe(baseEndRow + 10);
    });
  });
});
