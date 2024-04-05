describe('MergeCells keyboard shortcut', () => {
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

  describe('"Control" + "M"', () => {
    it('should toggle the cell when it points to the single cell', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      spyOn(getPlugin('mergeCells'), 'toggleMerge');

      selectCell(1, 1);
      keyDownUp(['control', 'm']);

      expect(getPlugin('mergeCells').toggleMerge).toHaveBeenCalledTimes(1);
    });

    it('should not toggle the cell when it points to the column header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      spyOn(getPlugin('mergeCells'), 'toggleMerge');

      selectCell(-1, 1);
      keyDownUp(['control', 'm']);

      expect(getPlugin('mergeCells').toggleMerge).toHaveBeenCalledTimes(0);
    });

    it('should not toggle the cell when it points to the row header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      spyOn(getPlugin('mergeCells'), 'toggleMerge');

      selectCell(1, -1);
      keyDownUp(['control', 'm']);

      expect(getPlugin('mergeCells').toggleMerge).toHaveBeenCalledTimes(0);
    });

    it('should not toggle the cell when it points to the corner', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      spyOn(getPlugin('mergeCells'), 'toggleMerge');

      selectCell(-1, -1);
      keyDownUp(['control', 'm']);

      expect(getPlugin('mergeCells').toggleMerge).toHaveBeenCalledTimes(0);
    });

    it('should merge selected cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
      });

      selectCells([[1, 1, 3, 3]]);
      keyDownUp(['control', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(3);
      expect(cell.colSpan).toBe(3);
    });

    it('should toggle the selected cells to merged/unmerged/merged state', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
      });

      selectCells([[1, 1, 3, 3]]);
      keyDownUp(['control', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(3);
      expect(cell.colSpan).toBe(3);

      keyDownUp(['control', 'm']);

      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);

      keyDownUp(['control', 'm']);

      expect(cell.rowSpan).toBe(3);
      expect(cell.colSpan).toBe(3);
    });
  });
});
