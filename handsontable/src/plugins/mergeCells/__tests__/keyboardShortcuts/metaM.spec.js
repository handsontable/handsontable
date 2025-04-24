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

  describe('"Command" + "M"', () => {
    it('should not merge selected cells', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
      });

      await selectCells([[1, 1, 3, 3]]);
      await keyDownUp(['command', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);
    });
  });
});
