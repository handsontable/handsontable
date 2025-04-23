describe('MergeCells keyboard shortcut', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  describe('"Control" + "M"', () => {
    it('should not toggle the cell when it points to the single cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      selectCell(1, 1);
      keyDownUp(['control', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);
    });

    it('should toggle the cells when it points to the whole column', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      selectColumns(1);
      listen();
      keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(5);
        expect(cell.colSpan).toBe(1);
      }

      keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should toggle the cells when it points to the whole row', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      selectRows(1);
      listen();
      keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(5);
      }

      keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should not toggle the cell when it points to the column header only', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp(['control', 'm']);

      {
        const cell = getCell(-1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
      {
        const cell = getCell(0, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should not toggle the cell when it points to the row header only', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, -1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
      {
        const cell = getCell(1, 0);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should not toggle the cell when it points to the corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      keyDownUp(['control', 'm']);

      {
        const cell = getCell(-1, -1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
      {
        const cell = getCell(0, 0);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should merge selected cells', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
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
        data: createSpreadsheetData(5, 5),
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
