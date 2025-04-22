describe('settings', () => {
  describe('timeFormat', () => {
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

    it('should have defined default value', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(getCellMeta(0, 0).timeFormat).toBe('h:mm:ss a');
    });
  });
});
