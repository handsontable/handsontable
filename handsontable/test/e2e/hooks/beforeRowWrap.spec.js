describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('beforeRowWrap', () => {
    it('should be fired once after row wrapping', () => {
      const beforeRowWrap = jasmine.createSpy('beforeRowWrap');

      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapRow: true,
        beforeRowWrap,
      });

      selectCell(0, 0);
      keyDownUp('arrowleft');

      expect(beforeRowWrap).toHaveBeenCalledTimes(1);
      expect(beforeRowWrap).toHaveBeenCalledWith(
        true,
        cellCoords(4, 4),
        true,
      );
    });
  });
});
