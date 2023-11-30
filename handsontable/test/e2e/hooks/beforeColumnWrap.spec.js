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
        jasmine.any(Object),
        cellCoords(4, 4),
        true,
      );
    });

    it('should add new rows by default when `minSpareRows` is defined', () => {
      const hot = handsontable({
        data: createSpreadsheetData(3, 5),
        autoWrapCol: false,
        minSpareRows: 2,
      });

      selectCell(4, 4);
      hot.selection.transformStart(1, 0, true);

      expect(countRows()).toBe(6);
      expect(countCols()).toBe(5);
    });

    it('should prevent adding new rows when `minSpareRows` is defined and the action is interrupted', () => {
      const hot = handsontable({
        data: createSpreadsheetData(3, 5),
        autoWrapCol: false,
        minSpareRows: 2,
        beforeColumnWrap(isActionInterrupted) {
          isActionInterrupted.value = false;
        },
      });

      selectCell(4, 4);
      hot.selection.transformStart(1, 0, true);

      expect(countRows()).toBe(5);
      expect(countCols()).toBe(5);
    });
  });
});
