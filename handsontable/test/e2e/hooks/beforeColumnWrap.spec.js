describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('beforeColumnWrap', () => {
    it('should be fired once after row wrapping', () => {
      const beforeColumnWrap = jasmine.createSpy('beforeColumnWrap');

      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapCol: true,
        beforeColumnWrap,
      });

      selectCell(0, 0);
      keyDownUp('arrowup');

      expect(beforeColumnWrap).toHaveBeenCalledTimes(1);
      expect(beforeColumnWrap).toHaveBeenCalledWith(
        true,
        cellCoords(4, 4),
        true,
      );
    });
  });
});
