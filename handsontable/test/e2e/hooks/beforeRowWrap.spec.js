describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('beforeRowWrap', () => {
    it('should be fired once after row wrapping', async() => {
      const beforeRowWrap = jasmine.createSpy('beforeRowWrap');

      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapRow: true,
        beforeRowWrap,
      });

      await selectCell(0, 0);
      await keyDownUp('arrowleft');

      expect(beforeRowWrap).toHaveBeenCalledTimes(1);
      expect(beforeRowWrap).toHaveBeenCalledWith(
        jasmine.any(Object),
        cellCoords(4, 4),
        true,
      );
    });

    it('should add new columns by default when `minSpareCols` is defined', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        autoWrapRow: false,
        minSpareCols: 2,
      });

      await selectCell(4, 4);

      selection().transformStart(0, 1, true);

      expect(countRows()).toBe(5);
      expect(countCols()).toBe(6);
    });

    it('should prevent adding new columns when `minSpareCols` is defined and the action is interrupted', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        autoWrapRow: false,
        minSpareCols: 2,
        beforeRowWrap(isActionInterrupted) {
          isActionInterrupted.value = false;
        },
      });

      await selectCell(4, 4);

      selection().transformStart(0, 1, true);

      expect(countRows()).toBe(5);
      expect(countCols()).toBe(5);
    });
  });
});
