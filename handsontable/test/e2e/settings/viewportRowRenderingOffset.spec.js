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
      const layout = getThemeLayout();

      handsontable({
        data: createSpreadsheetData(50, 50),
        width: layout.e2ePickForDensity({ compact: 100, default: 125, comfortable: 125 }),
        height: layout.e2ePickForDensity({ compact: 100, default: 125, comfortable: 159 }),
        viewportRowRenderingOffset: 0,
        afterViewportRowCalculatorOverride(calculatorInstance) {
          calculator = calculatorInstance;
        },
      });

      await selectCell(25, 25);

      expect(calculator.startRow).toBe(22);
      expect(calculator.endRow).toBe(26);

      await updateSettings({ viewportRowRenderingOffset: 10 });

      expect(calculator.startRow).toBe(12);
      expect(calculator.endRow).toBe(36);
    });
  });
});
