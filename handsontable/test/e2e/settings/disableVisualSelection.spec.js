describe('settings', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('disableVisualSelection', () => {
    it('should be `false` by default', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(hot.getSettings().disableVisualSelection).toBe(false);
    });

    // The rest of the E2E tests you can find in the Selection module ./handsontable/src/selection/__tests__/selection/isDisabledCellSelection.spec.js
  });
});
