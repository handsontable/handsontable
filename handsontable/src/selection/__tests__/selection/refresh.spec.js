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

  describe('`refresh` method', () => {
    it('should call all selection related hooks after selection refreshing', async() => {
      const beforeSetRangeStart = jasmine.createSpy('beforeSetRangeStart');
      const beforeSetRangeStartOnly = jasmine.createSpy('beforeSetRangeStartOnly');
      const beforeSetRangeEnd = jasmine.createSpy('beforeSetRangeEnd');
      const afterSelection = jasmine.createSpy('afterSelection');
      const afterSelectionEnd = jasmine.createSpy('afterSelectionEnd');
      const beforeSelectionFocusSet = jasmine.createSpy('beforeSelectionFocusSet');
      const afterSelectionFocusSet = jasmine.createSpy('afterSelectionFocusSet');

      handsontable({
        data: createSpreadsheetData(8, 8),
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
        afterSelection,
        afterSelectionEnd,
        beforeSelectionFocusSet,
        afterSelectionFocusSet,
      });

      await selectCells([
        [1, 1, 3, 3],
        [2, 2, 4, 4],
        [5, 5, 5, 5],
      ]);

      beforeSetRangeStart.calls.reset();
      beforeSetRangeStartOnly.calls.reset();
      beforeSetRangeEnd.calls.reset();
      afterSelection.calls.reset();
      afterSelectionEnd.calls.reset();
      beforeSelectionFocusSet.calls.reset();
      afterSelectionFocusSet.calls.reset();

      hot().selection.refresh();

      expect(beforeSetRangeStart).toHaveBeenCalledTimes(0);
      expect(beforeSetRangeStartOnly).toHaveBeenCalledTimes(3);
      expect(beforeSetRangeEnd).toHaveBeenCalledTimes(3);
      expect(afterSelection).toHaveBeenCalledTimes(3);
      expect(afterSelectionEnd).toHaveBeenCalledTimes(1);
      expect(beforeSelectionFocusSet).toHaveBeenCalledTimes(0);
      expect(afterSelectionFocusSet).toHaveBeenCalledTimes(0);
    });

    it('should reflect the changes made in ranges after refresh call', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCells([
        [1, 1, 3, 3],
        [6, 6, 6, 6],
        [2, 2, 6, 5],
      ]);

      const selectionRange = hot().selection.getSelectedRange();

      selectionRange.pop();

      const firstLayer = selectionRange.peekByIndex(0);

      firstLayer.from.row = 2;
      firstLayer.to.row = 6;

      const secondLayer = selectionRange.peekByIndex(1);

      secondLayer.from.row = 5;
      secondLayer.to.row = 7;
      secondLayer.highlight.row = 6;

      hot().selection.refresh();

      expect(`
        |   ║   : - : - : - :   :   : - :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   : 0 :   |
        | - ║   : 0 : 0 : 0 :   :   : A :   |
        | - ║   :   :   :   :   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not change the visual effect and lose internal state of the current selection after refresh', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCells([
        [1, 1, 3, 3],
        [2, 2, 6, 5],
      ]);
      await keyDown('control/meta');
      await simulateClick(getCell(6, -1, true));
      await simulateClick(getCell(-1, 5, true));
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(`
        |   ║ - : - : - : - : - : * : - : - |
        |===:===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : 0 :   :   |
        | - ║   : 0 : 0 : 0 :   : 0 :   :   |
        | - ║   : 0 : 1 : 1 : 0 : 1 :   :   |
        | - ║   : 0 : 1 : 1 : 0 : B :   :   |
        | - ║   :   : 0 : 0 : 0 : 1 :   :   |
        | - ║   :   : 0 : 0 : 0 : 1 :   :   |
        | * ║ 0 : 0 : 1 : 1 : 1 : 2 : 0 : 0 |
        | - ║   :   :   :   :   : 0 :   :   |
        `).toBeMatchToSelectionPattern();

      hot().selection.refresh();

      expect(hot().selection.isSelectedByRowHeader(0)).toBe(false);
      expect(hot().selection.isSelectedByRowHeader(1)).toBe(false);
      expect(hot().selection.isSelectedByRowHeader(2)).toBe(true);
      expect(hot().selection.isSelectedByRowHeader(3)).toBe(false);
      expect(hot().selection.isSelectedByColumnHeader(0)).toBe(false);
      expect(hot().selection.isSelectedByColumnHeader(1)).toBe(false);
      expect(hot().selection.isSelectedByColumnHeader(2)).toBe(false);
      expect(hot().selection.isSelectedByColumnHeader(3)).toBe(true);
      expect(`
        |   ║ - : - : - : - : - : * : - : - |
        |===:===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : 0 :   :   |
        | - ║   : 0 : 0 : 0 :   : 0 :   :   |
        | - ║   : 0 : 1 : 1 : 0 : 1 :   :   |
        | - ║   : 0 : 1 : 1 : 0 : B :   :   |
        | - ║   :   : 0 : 0 : 0 : 1 :   :   |
        | - ║   :   : 0 : 0 : 0 : 1 :   :   |
        | * ║ 0 : 0 : 1 : 1 : 1 : 2 : 0 : 0 |
        | - ║   :   :   :   :   : 0 :   :   |
        `).toBeMatchToSelectionPattern();
    });
  });
});
