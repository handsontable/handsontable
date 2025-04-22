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

  describe('autoWrapCol', () => {
    it('should be `false` by default', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5)
      });

      expect(hot.getSettings().autoWrapCol).toBe(false);
    });

    // The rest of the E2E tests you can find in the Selection module ./handsontable/src/selection/__tests__/keyboardShortcuts/navigation.spec.js
  });
});
