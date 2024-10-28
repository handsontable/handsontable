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
    it('should allow detecting when the last layer of the non-contiguous selection is applied', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });
      const afterSetRangeEnd = jasmine.createSpy('afterSetRangeEnd');

      hot.selection.addLocalHook('afterSetRangeEnd', afterSetRangeEnd);

      hot.selection.setExpectedLayers(3);

      hot.selection.setRangeStartOnly(cellCoords(1, 1), false);
      hot.selection.setRangeEnd(cellCoords(1, 1));
      hot.selection.setRangeStartOnly(cellCoords(2, 2), false);
      hot.selection.setRangeEnd(cellCoords(2, 2));
      hot.selection.setRangeStartOnly(cellCoords(3, 3), false);
      hot.selection.setRangeEnd(cellCoords(3, 3));

      expect(afterSetRangeEnd).toHaveBeenCalledTimes(3);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(1, 1), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(2, 2), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(3, 3), true);

      hot.selection.finish();
    });

    it('should mark all selection layer as last one when is not used', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });
      const afterSetRangeEnd = jasmine.createSpy('afterSetRangeEnd');

      hot.selection.addLocalHook('afterSetRangeEnd', afterSetRangeEnd);

      hot.selection.setRangeStartOnly(cellCoords(1, 1), false);
      hot.selection.setRangeEnd(cellCoords(1, 1));
      hot.selection.setRangeStartOnly(cellCoords(2, 2), false);
      hot.selection.setRangeEnd(cellCoords(2, 2));
      hot.selection.setRangeStartOnly(cellCoords(3, 3), false);
      hot.selection.setRangeEnd(cellCoords(3, 3));

      expect(afterSetRangeEnd).toHaveBeenCalledTimes(3);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(1, 1), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(2, 2), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(3, 3), true);
    });

    it('should mark all selection layer as last one when after calling the `finish` method', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });
      const afterSetRangeEnd = jasmine.createSpy('afterSetRangeEnd');

      hot.selection.addLocalHook('afterSetRangeEnd', afterSetRangeEnd);

      hot.selection.setExpectedLayers(3);

      hot.selection.setRangeStartOnly(cellCoords(1, 1), false);
      hot.selection.setRangeEnd(cellCoords(1, 1));
      hot.selection.setRangeStartOnly(cellCoords(2, 2), false);
      hot.selection.setRangeEnd(cellCoords(2, 2));
      hot.selection.setRangeStartOnly(cellCoords(3, 3), false);
      hot.selection.setRangeEnd(cellCoords(3, 3));

      hot.selection.finish(); // resets the `#expectedLayersCount` field

      hot.selection.setRangeStartOnly(cellCoords(4, 4), false);
      hot.selection.setRangeEnd(cellCoords(4, 4));
      hot.selection.setRangeStartOnly(cellCoords(5, 5), false);
      hot.selection.setRangeEnd(cellCoords(5, 5));

      expect(afterSetRangeEnd).toHaveBeenCalledTimes(5);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(1, 1), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(2, 2), false);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(3, 3), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(4, 4), true);
      expect(afterSetRangeEnd).toHaveBeenCalledWith(cellCoords(5, 5), true);
    });
  });
});
