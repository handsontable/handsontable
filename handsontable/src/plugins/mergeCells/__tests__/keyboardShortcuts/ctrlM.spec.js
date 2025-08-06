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
    it('should not toggle the cell when it points to the single cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCell(1, 1);
      await keyDownUp(['control', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);
    });

    it('should toggle the cells when it points to the whole column', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      await selectColumns(1);
      await listen();
      await keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(5);
        expect(cell.colSpan).toBe(1);
      }

      await keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should toggle the cells when it points to the whole row', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
      });

      await selectRows(1);
      await listen();
      await keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(5);
      }

      await keyDownUp(['control', 'm']);

      {
        const cell = getCell(1, 1);

        expect(cell.rowSpan).toBe(1);
        expect(cell.colSpan).toBe(1);
      }
    });

    it('should not toggle the cell when it points to the column header only', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      await keyDownUp(['control', 'm']);

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

    it('should not toggle the cell when it points to the row header only', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      await keyDownUp(['control', 'm']);

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

    it('should not toggle the cell when it points to the corner', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      await keyDownUp(['control', 'm']);

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

    it('should merge selected cells', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
      });

      await selectCells([[1, 1, 3, 3]]);
      await keyDownUp(['control', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(3);
      expect(cell.colSpan).toBe(3);
    });

    it('should merge selected cells only for the active selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        mergeCells: true,
      });

      await selectCells([
        [0, 0, 1, 1],
        [2, 2, 3, 3],
        [4, 4, 5, 5],
      ]);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer (C4)
      await keyDownUp(['control', 'm']);

      const cell = getCell(2, 2);

      expect(cell.rowSpan).toBe(2);
      expect(cell.colSpan).toBe(2);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 3,3']);
    });

    it('should toggle the selected cells to merged/unmerged/merged state', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: true,
      });

      await selectCells([[1, 1, 3, 3]]);
      await keyDownUp(['control', 'm']);

      const cell = getCell(1, 1);

      expect(cell.rowSpan).toBe(3);
      expect(cell.colSpan).toBe(3);

      await keyDownUp(['control', 'm']);

      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);

      await keyDownUp(['control', 'm']);

      expect(cell.rowSpan).toBe(3);
      expect(cell.colSpan).toBe(3);
    });
  });
});
