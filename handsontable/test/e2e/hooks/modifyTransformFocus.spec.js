describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyTransformFocus', () => {
    it('should be fired after changing the coordinates using `transformFocus` method only', async() => {
      const modifyTransformFocus = jasmine.createSpy('modifyTransformFocus');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyTransformFocus,
      });

      await selectCell(0, 0, 3, 3);

      selection().transformFocus(1, 2);

      expect(modifyTransformFocus).toHaveBeenCalledWith(cellCoords(1, 2));
      expect(modifyTransformFocus).toHaveBeenCalledTimes(1);

      selection().transformStart(2, 3);

      expect(modifyTransformFocus).toHaveBeenCalledTimes(1);

      selection().transformEnd(4, 4);

      expect(modifyTransformFocus).toHaveBeenCalledTimes(1);
    });
  });
});
