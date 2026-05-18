describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('afterModifyTransformStart', () => {
    it('should be fired after changing the coordinates using `transformStart` method only', async() => {
      const afterModifyTransformStart = jasmine.createSpy('afterModifyTransformStart');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterModifyTransformStart,
      });

      await selectCell(0, 0);

      selection().transformStart(1, 2);

      expect(afterModifyTransformStart).toHaveBeenCalledWith(cellCoords(1, 2), 0, 0);
      expect(afterModifyTransformStart).toHaveBeenCalledTimes(1);

      selection().transformFocus(2, 3);

      expect(afterModifyTransformStart).toHaveBeenCalledTimes(1);

      selection().transformEnd(4, 4);

      expect(afterModifyTransformStart).toHaveBeenCalledTimes(1);
    });
  });
});
