describe('Hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('afterSelectionFocusSet', () => {
    it('should be fired with proper arguments when the focus is changed', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectionFocusSet = jasmine.createSpy('afterSelectionFocusSet');

      await selectCell(1, 1, 5, 5);

      addHook('afterSelectionFocusSet', afterSelectionFocusSet);
      selection().setRangeFocus(cellCoords(2, 3));

      expect(afterSelectionFocusSet).toHaveBeenCalledTimes(1);
      expect(afterSelectionFocusSet).toHaveBeenCalledWith(2, 3, jasmine.any(Object));

      selection().setRangeFocus(cellCoords(4, 5));

      expect(afterSelectionFocusSet).toHaveBeenCalledTimes(2);
      expect(afterSelectionFocusSet).toHaveBeenCalledWith(4, 5, jasmine.any(Object));
    });

    it('should be possible to prevent viewport scroll after focus position changed', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        width: 200,
        height: 130,
        colHeaders: true,
        rowHeaders: true,
        afterSelectionFocusSet(row, column, preventScrolling) {
          preventScrolling.value = true;
        }
      });

      await selectColumns(1, 1, -1);
      await listen();

      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should not be fired when single cell is selected', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectionFocusSet = jasmine.createSpy('afterSelectionFocusSet');

      addHook('afterSelectionFocusSet', afterSelectionFocusSet);

      await selectCell(1, 1);

      expect(afterSelectionFocusSet).not.toHaveBeenCalled();
    });

    it('should not be fired when multiple cells are selected', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectionFocusSet = jasmine.createSpy('afterSelectionFocusSet');

      addHook('afterSelectionFocusSet', afterSelectionFocusSet);

      await selectCell(1, 1, 5, 5);

      expect(afterSelectionFocusSet).not.toHaveBeenCalled();
    });

    it('should not be fired when non-contiguous cells are selected', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const afterSelectionFocusSet = jasmine.createSpy('afterSelectionFocusSet');

      addHook('afterSelectionFocusSet', afterSelectionFocusSet);
      await selectCells([[1, 1], [5, 5]]);

      expect(afterSelectionFocusSet).not.toHaveBeenCalled();
    });
  });
});
