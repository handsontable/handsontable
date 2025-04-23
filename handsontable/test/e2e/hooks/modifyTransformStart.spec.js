describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyTransformStart', () => {
    it('should be fired after changing the coordinates using `transformStart` method only', async() => {
      const modifyTransformStart = jasmine.createSpy('modifyTransformStart');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyTransformStart,
      });

      await selectCell(0, 0);

      selection().transformStart(1, 2);

      expect(modifyTransformStart).toHaveBeenCalledWith(cellCoords(1, 2));
      expect(modifyTransformStart).toHaveBeenCalledTimes(1);

      selection().transformFocus(2, 3);

      expect(modifyTransformStart).toHaveBeenCalledTimes(1);

      selection().transformEnd(4, 4);

      expect(modifyTransformStart).toHaveBeenCalledTimes(1);
    });
  });
});
