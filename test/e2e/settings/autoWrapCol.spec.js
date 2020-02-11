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
    it('should be defaults true', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5)
      });

      expect(hot.getSettings().autoWrapCol).toBe(true);
    });

    it('should move to the neighboring column when it reaches the end of the current', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapCol: true
      });

      selectCell(4, 0);

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);

      keyDownUp('arrow_down');

      expect(getSelected()).toEqual([[0, 1, 0, 1]]);

      keyDownUp('arrow_up');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });

    it('should move to the start of the table when it reaches the end of the table', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        autoWrapCol: true
      });

      selectCell(4, 4);

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);

      keyDownUp('arrow_down');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);

      keyDownUp('arrow_up');

      expect(getSelected()).toEqual([[4, 4, 4, 4]]);

    });
  });
});
