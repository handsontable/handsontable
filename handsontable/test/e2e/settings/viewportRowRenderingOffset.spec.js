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
    it('should be possible to change the size of the calculated rendered rows', () => {
      // TODO [themes]: Could be potentially improved by per-theme configuration
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

      expect(calculator.startRow).forThemes(({ classic, main }) => {
        classic.toBe(22);
        main.toBe(23);
      });
      expect(calculator.endRow).toBe(26);

      updateSettings({ viewportRowRenderingOffset: 10 });

      expect(calculator.startRow).forThemes(({ classic, main }) => {
        classic.toBe(12);
        main.toBe(13);
      });
      expect(calculator.endRow).toBe(36);
    });
  });
});
