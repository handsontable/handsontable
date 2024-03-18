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

  describe('`setRangeFocus` method', () => {
    it('should do nothing when there is no selection range defined', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      hot.selection.setRangeFocus(cellCoords(1, 1));

      expect(`
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should move the focus highlight position to specific coords', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      selectCells([[1, 1, 3, 3]]);
      hot.selection.setRangeFocus(cellCoords(2, 2));

      expect(`
        |   :   :   :   |
        |   : 0 : 0 : 0 |
        |   : 0 : A : 0 |
        |   : 0 : 0 : 0 |
        |   :   :   :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 3,3']);
    });

    it('should move the focus highlight position to specific coords outside of the selected range', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      selectCells([[1, 1, 3, 3]]);
      hot.selection.setRangeFocus(cellCoords(4, 2));

      expect(`
        |   :   :   :   |
        |   : 0 : 0 : 0 |
        |   : 0 : 0 : 0 |
        |   : 0 : 0 : 0 |
        |   :   : # :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 1,1 to: 3,3']);
    });

    it('should trigger the "beforeSetFocus" local hook', () => {
      const beforeSetFocus = jasmine.createSpy('beforeSetFocus');
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      hot.selection.addLocalHook('beforeSetFocus', beforeSetFocus);

      selectCells([[1, 1, 3, 3]]);
      hot.selection.setRangeFocus(cellCoords(2, 2));

      expect(beforeSetFocus).toHaveBeenCalledOnceWith(cellCoords(2, 2));
    });

    it('should trigger the "afterSetFocus" local hook', () => {
      const afterSetFocus = jasmine.createSpy('afterSetFocus');
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      hot.selection.addLocalHook('afterSetFocus', afterSetFocus);

      selectCells([[1, 1, 3, 3]]);
      hot.selection.setRangeFocus(cellCoords(2, 2));

      expect(afterSetFocus).toHaveBeenCalledOnceWith(cellCoords(2, 2));
    });

    it('should trigger the "beforeHighlightSet" local hook', () => {
      const beforeHighlightSet = jasmine.createSpy('beforeHighlightSet');
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      selectCells([[1, 1, 3, 3]]);

      hot.selection.addLocalHook('beforeHighlightSet', beforeHighlightSet);
      hot.selection.setRangeFocus(cellCoords(2, 2));

      expect(beforeHighlightSet).toHaveBeenCalledTimes(1);
    });
  });
});
