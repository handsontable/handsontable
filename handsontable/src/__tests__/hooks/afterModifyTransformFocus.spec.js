describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('afterModifyTransformFocus', () => {
    it('should be fired after changing the coordinates using `transformStart` method only', async() => {
      const afterModifyTransformFocus = jasmine.createSpy('afterModifyTransformFocus');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterModifyTransformFocus,
      });

      await selectCell(0, 0, 3, 3);

      selection().transformFocus(1, 2);

      expect(afterModifyTransformFocus).toHaveBeenCalledWith(cellCoords(1, 2), 0, 0);
      expect(afterModifyTransformFocus).toHaveBeenCalledTimes(1);

      selection().transformStart(2, 3);

      expect(afterModifyTransformFocus).toHaveBeenCalledTimes(1);

      selection().transformEnd(4, 4);

      expect(afterModifyTransformFocus).toHaveBeenCalledTimes(1);
    });
  });
});
