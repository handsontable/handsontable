describe('settings', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  describe('viewportColumnRenderingOffset', () => {
    it('should be possible to change the size of the calculated rendered rows', async() => {
      let calculator;

      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 100,
        height: 100,
        viewportColumnRenderingOffset: 0,
        afterViewportColumnCalculatorOverride(calculatorInstance) {
          calculator = calculatorInstance;
        },
      });

      await selectCell(25, 25);

      expect(calculator.startColumn).toBe(24);
      expect(calculator.endColumn).toBe(25);

      await updateSettings({ viewportColumnRenderingOffset: 10 });

      expect(calculator.startColumn).toBe(14);
      expect(calculator.endColumn).toBe(35);
    });
  });
});
