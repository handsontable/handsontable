describe('settings', () => {
  describe('sourceDataWarningMessage', () => {
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

    it('should have defined default value', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(getCellMeta(0, 0).sourceDataWarningMessage).toBeUndefined();
    });

    it('should print warning message when the validator returns false', async() => {
      const warnSpy = spyOnConsoleWarn();

      handsontable({
        data: [[]],
        sourceDataWarningMessage: 'The source data is invalid.',
        sourceDataValidator() {
          return false;
        },
      });

      await loadData(createSpreadsheetData(5, 5));

      expect(warnSpy).toHaveBeenCalledWith('The source data is invalid.');
    });

    it('should not print warning message when the validator returns true', async() => {
      const warnSpy = spyOnConsoleWarn();

      handsontable({
        data: [[]],
        sourceDataWarningMessage: 'The source data is invalid.',
        sourceDataValidator() {
          return true;
        },
      });

      await loadData(createSpreadsheetData(5, 5));

      expect(warnSpy).not.toHaveBeenCalledWith('The source data is invalid.');
    });
  });
});
