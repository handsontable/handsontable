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

  describe('"Command" + "M"', () => {
    it('should not merge selected cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        mergeCells: true,
      });

      selectCells([[1, 1, 3, 3]]);
      keyDownUp(['command', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);
    });
  });
});
