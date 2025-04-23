describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    $('body').find('#testContainer').remove();
  });

  describe('beforeColumnWrap', () => {
    it('should be fired once after row wrapping', async() => {
      const beforeColumnWrap = jasmine.createSpy('beforeColumnWrap');

      handsontable({
        data: createSpreadsheetData(5, 5),
        autoWrapCol: true,
        beforeColumnWrap,
      });

      await selectCell(0, 0);
      await keyDownUp('arrowup');

      expect(beforeColumnWrap).toHaveBeenCalledTimes(1);
      expect(beforeColumnWrap).toHaveBeenCalledWith(
        jasmine.any(Object),
        cellCoords(4, 4),
        true,
      );
    });

    it('should add new rows by default when `minSpareRows` is defined', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        autoWrapCol: false,
        minSpareRows: 2,
      });

      await selectCell(4, 4);

      selection().transformStart(1, 0, true);

      expect(countRows()).toBe(6);
      expect(countCols()).toBe(5);
    });

    it('should prevent adding new rows when `minSpareRows` is defined and the action is interrupted', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        autoWrapCol: false,
        minSpareRows: 2,
        beforeColumnWrap(isActionInterrupted) {
          isActionInterrupted.value = false;
        },
      });

      await selectCell(4, 4);

      selection().transformStart(1, 0, true);

      expect(countRows()).toBe(5);
      expect(countCols()).toBe(5);
    });
  });
});
