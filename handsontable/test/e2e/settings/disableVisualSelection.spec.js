describe('settings', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
    }
  });

  describe('disableVisualSelection', () => {
    it('should be `false` by default', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(getSettings().disableVisualSelection).toBe(false);
    });

    // The rest of the E2E tests you can find in the Selection module ./handsontable/src/selection/__tests__/selection/isDisabledCellSelection.spec.js
  });
});
