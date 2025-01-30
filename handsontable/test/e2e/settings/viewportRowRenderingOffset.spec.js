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
    it.forTheme('classic')('should be possible to change the size of the calculated rendered rows', () => {
      let calculator;

      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 100,
        height: 100,
        viewportRowRenderingOffset: 0,
        afterViewportRowCalculatorOverride(calculatorInstance) {
          calculator = calculatorInstance;
        },
      });

      selectCell(25, 25);

      expect(calculator.startRow).toBe(22);
      expect(calculator.endRow).toBe(26);

      updateSettings({ viewportRowRenderingOffset: 10 });

      expect(calculator.startRow).toBe(12);
      expect(calculator.endRow).toBe(36);
    });

    it.forTheme('main')('should be possible to change the size of the calculated rendered rows', () => {
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

      selectCell(25, 25);

      expect(calculator.startRow).toBe(22);
      expect(calculator.endRow).toBe(26);

      updateSettings({ viewportRowRenderingOffset: 10 });

      expect(calculator.startRow).toBe(12);
      expect(calculator.endRow).toBe(36);
    });
  });
});
