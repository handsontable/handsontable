describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`setExpectedLayers` method', () => {
    it('should allow detecting when the last layer of the non-contiguous selection is applied', async() => {
      handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });
      const afterSetRangeEnd = jasmine.createSpy('afterSetRangeEnd');

      selection().addLocalHook('afterSetRangeEnd', afterSetRangeEnd);

      selection().setExpectedLayers(3);

      selection().setRangeStartOnly(cellCoords(1, 1), false);
      selection().setRangeEnd(cellCoords(1, 1));
      selection().setRangeStartOnly(cellCoords(2, 2), false);
      selection().setRangeEnd(cellCoords(2, 2));
      selection().setRangeStartOnly(cellCoords(3, 3), false);
      selection().setRangeEnd(cellCoords(3, 3));

      expect(afterSetRangeEnd).toHaveBeenCalledTimes(3);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(1, 1), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(2, 2), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(3, 3), true);

      selection().finish();
    });

    it('should mark all selection layer as last one when is not used', async() => {
      handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });
      const afterSetRangeEnd = jasmine.createSpy('afterSetRangeEnd');

      selection().addLocalHook('afterSetRangeEnd', afterSetRangeEnd);

      selection().setRangeStartOnly(cellCoords(1, 1), false);
      selection().setRangeEnd(cellCoords(1, 1));
      selection().setRangeStartOnly(cellCoords(2, 2), false);
      selection().setRangeEnd(cellCoords(2, 2));
      selection().setRangeStartOnly(cellCoords(3, 3), false);
      selection().setRangeEnd(cellCoords(3, 3));

      expect(afterSetRangeEnd).toHaveBeenCalledTimes(3);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(1, 1), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(2, 2), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(3, 3), true);
    });

    it('should mark all selection layer as last one when after calling the `finish` method', async() => {
      handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });
      const afterSetRangeEnd = jasmine.createSpy('afterSetRangeEnd');

      selection().addLocalHook('afterSetRangeEnd', afterSetRangeEnd);

      selection().setExpectedLayers(3);

      selection().setRangeStartOnly(cellCoords(1, 1), false);
      selection().setRangeEnd(cellCoords(1, 1));
      selection().setRangeStartOnly(cellCoords(2, 2), false);
      selection().setRangeEnd(cellCoords(2, 2));
      selection().setRangeStartOnly(cellCoords(3, 3), false);
      selection().setRangeEnd(cellCoords(3, 3));

      selection().finish(); // resets the `#expectedLayersCount` field

      selection().setRangeStartOnly(cellCoords(4, 4), false);
      selection().setRangeEnd(cellCoords(4, 4));
      selection().setRangeStartOnly(cellCoords(5, 5), false);
      selection().setRangeEnd(cellCoords(5, 5));

      expect(afterSetRangeEnd).toHaveBeenCalledTimes(5);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(1, 1), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(2, 2), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(3, 3), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(4, 4), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(5, 5), true);
    });
  });
});
