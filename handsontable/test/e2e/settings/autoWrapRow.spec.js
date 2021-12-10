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

  describe('autoWrapRow', () => {
    it('should be `false` by default', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5)
      });

      expect(hot.getSettings().autoWrapRow).toBe(false);
    });

    it('should move to the neighboring row when it reaches the end of the current', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true
      });

      selectCell(0, 4);

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);

      keyDownUp('arrow_right');

      expect(getSelected()).toEqual([[1, 0, 1, 0]]);

      keyDownUp('arrow_left');

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });

    it('should move to the start of the table when it reaches the end of the table', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapRow: true
      });

      selectCell(4, 4);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);

      keyDownUp('arrow_right');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);

      keyDownUp('arrow_left');

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);

    });
  });
});
