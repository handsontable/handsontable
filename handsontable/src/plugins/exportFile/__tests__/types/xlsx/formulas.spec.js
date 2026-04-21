import ExcelJS from 'exceljs';
import HyperFormula from 'hyperformula';

describe('exportFile XLSX type — formulas', () => {
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

  describe('column summary formulas', () => {
    it('should export a `sum` summary as an Excel SUM formula when `exportFormulas` is true', async() => {
      handsontable({
        data: [[10], [20], [30], [null]],
        columnSummary: [{
          type: 'sum',
          destinationRow: 3,
          destinationColumn: 0,
          ranges: [[0, 2]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const summaryCell = ws.getRow(4).getCell(1);

      // ExcelJS stores formula cells as { formula, result }.
      expect(summaryCell.value?.formula).toBe('SUM(A1:A3)');
    });

    it('should exclude the destination row from the formula range when no ranges are configured', async() => {
      // When `ranges` is not set, ColumnSummary defaults to all rows [0, countRows-1],
      // which includes the destination row itself. Without the fix, the generated Excel
      // formula would reference its own cell (e.g. =SUM(A1:A4) where A4 is the result),
      // causing a circular reference error in Excel.
      handsontable({
        data: [[10], [20], [30], [null]], // row 3 = destination (no explicit ranges)
        columnSummary: [{
          type: 'sum',
          destinationRow: 3,
          destinationColumn: 0,
          // no ranges → defaults to [[0, 3]], which would include the destination row
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const summaryCell = ws.getRow(4).getCell(1);

      // The formula must NOT reference its own cell (A4).
      expect(summaryCell.value?.formula).toBe('SUM(A1:A3)');
    });

    it('should exclude all summary destination rows from every formula range to prevent cross-formula circular references', async() => {
      // When multiple summaries all use the default range (all rows), each formula would
      // include the other summaries' destination cells.  Because those cells also hold
      // formulas, this creates indirect circular chains (e.g. SUM→MIN→SUM).
      // Every destination row must be excluded from every formula's source range.
      handsontable({
        data: [[10], [20], [30], [null], [null]], // rows 3 and 4 are destinations
        columnSummary: [
          { type: 'sum', destinationRow: 3, destinationColumn: 0 },
          { type: 'min', destinationRow: 4, destinationColumn: 0 },
          // no ranges → both default to [[0, countRows-1]] = [[0, 4]]
        ],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Both formulas must reference only the three data rows — not each other.
      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A1:A3)');
      expect(ws.getRow(5).getCell(1).value?.formula).toBe('MIN(A1:A3)');
    });

    it('should include the pre-calculated value as the `result` field on the formula cell for interoperability with non-Excel readers', async() => {
      handsontable({
        data: [[10], [20], [30], [null]],
        columnSummary: [{
          type: 'sum',
          destinationRow: 3,
          destinationColumn: 0,
          ranges: [[0, 2]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const summaryCell = ws.getRow(4).getCell(1);

      expect(summaryCell.value?.formula).toBe('SUM(A1:A3)');
      expect(summaryCell.value?.result).toBe(60);
    });

    it('should export the pre-calculated static value when `exportFormulas` is false (default)', async() => {
      handsontable({
        data: [[10], [20], [30], [null]],
        columnSummary: [{
          type: 'sum',
          destinationRow: 3,
          destinationColumn: 0,
          ranges: [[0, 2]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();
      const summaryCell = ws.getRow(4).getCell(1);

      // Default: static value, not a live formula.
      expect(summaryCell.value?.formula).toBeUndefined();
    });

    it('should export `min`, `max`, `average`, and `count` as the matching Excel functions', async() => {
      handsontable({
        data: [[5], [15], [10], [null], [null], [null], [null]],
        columnSummary: [
          { type: 'min', destinationRow: 3, destinationColumn: 0, ranges: [[0, 2]] },
          { type: 'max', destinationRow: 4, destinationColumn: 0, ranges: [[0, 2]] },
          { type: 'average', destinationRow: 5, destinationColumn: 0, ranges: [[0, 2]] },
          { type: 'count', destinationRow: 6, destinationColumn: 0, ranges: [[0, 2]] },
        ],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      expect(ws.getRow(4).getCell(1).value?.formula).toBe('MIN(A1:A3)');
      expect(ws.getRow(5).getCell(1).value?.formula).toBe('MAX(A1:A3)');
      expect(ws.getRow(6).getCell(1).value?.formula).toBe('AVERAGE(A1:A3)');
      expect(ws.getRow(7).getCell(1).value?.formula).toBe('COUNT(A1:A3)');
    });

    it('should fall back to the static value for a `custom` type summary even when `exportFormulas` is true', async() => {
      handsontable({
        data: [[1], [2], [null]],
        columnSummary: [{
          type: 'custom',
          destinationRow: 2,
          destinationColumn: 0,
          customFunction() { return 99; },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const cell = ws.getRow(3).getCell(1);

      // Static value — not a formula object.
      expect(typeof cell.value).not.toBe('object');
      expect(cell.value).toBe('99');
    });

    // Known limitation: `custom` summaries use arbitrary JavaScript functions that
    // have no generic Excel formula equivalent, so they cannot be exported as live
    // formulas even when `exportFormulas` is true.
    xit('should export a `custom` summary function as a live Excel formula', async() => {
      handsontable({
        data: [[10], [20], [30], [null]],
        columnSummary: [{
          type: 'custom',
          destinationRow: 3,
          destinationColumn: 0,
          // Example: range = max - min (arbitrary JS, no direct Excel equivalent).
          customFunction(endpoint) {
            return this.calculateMinMax(endpoint, 'max') - this.calculateMinMax(endpoint, 'min');
          },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const cell = ws.getRow(4).getCell(1);

      // Currently fails: custom summaries always export as static values.
      expect(cell.value?.formula).toBeDefined();
    });

    it('should offset the formula row references when column headers are exported', async() => {
      handsontable({
        data: [[100], [200], [null]],
        colHeaders: ['Value'],
        columnSummary: [{
          type: 'sum',
          destinationRow: 2,
          destinationColumn: 0,
          ranges: [[0, 1]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // With one header row, data row 0 maps to Excel row 2, so the
      // source range A1:A2 in data space becomes A2:A3 in Excel.
      const ws = await parseXlsx({ colHeaders: true, exportFormulas: true });

      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A2:A3)');
    });

    it('should offset the formula column reference when row headers are exported', async() => {
      handsontable({
        data: [[10], [20], [null]],
        rowHeaders: true,
        columnSummary: [{
          type: 'sum',
          destinationRow: 2,
          destinationColumn: 0,
          ranges: [[0, 1]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // With a row-header column, data column 0 maps to Excel column B.
      const ws = await parseXlsx({ rowHeaders: true, exportFormulas: true });

      expect(ws.getRow(3).getCell(2).value?.formula).toBe('SUM(B1:B2)');
    });

    it('should use the source column when it differs from the destination column', async() => {
      handsontable({
        data: [[1, 2], [3, 4], [null, null]],
        columnSummary: [{
          type: 'sum',
          sourceColumn: 1,
          destinationRow: 2,
          destinationColumn: 0,
          ranges: [[0, 1]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Source is column B (index 1), destination is column A (index 0).
      expect(ws.getRow(3).getCell(1).value?.formula).toBe('SUM(B1:B2)');
    });

    it('should handle a non-contiguous range as multiple references in the formula', async() => {
      handsontable({
        data: [[10], [20], [30], [40], [null]],
        columnSummary: [{
          type: 'sum',
          destinationRow: 4,
          destinationColumn: 0,
          ranges: [[0, 1], [3, 3]],
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Rows 0-1 and row 3 → A1:A2 and A4.
      expect(ws.getRow(5).getCell(1).value?.formula).toBe('SUM(A1:A2,A4)');
    });

    it('should export the static value when ColumnSummary plugin is not enabled', async() => {
      handsontable({
        data: [[10], [20], [30]],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // No summaries configured — plain numeric strings.
      expect(ws.getRow(1).getCell(1).value).toBe('10');
      expect(ws.getRow(3).getCell(1).value).toBe('30');
    });
  });

  describe('`exportFormulas` option — HyperFormula integration', () => {
    it('should export a HyperFormula formula cell as a live Excel formula when `exportFormulas` is true', async() => {
      handsontable({
        data: [[1], [2], [3], ['=SUM(A1:A3)']],
        formulas: { engine: HyperFormula },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Row 4 contains the formula cell; data starts at Excel row 1 (no headers).
      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A1:A3)');
    });

    it('should export the calculated value when `exportFormulas` is false (default)', async() => {
      handsontable({
        data: [[1], [2], [3], ['=SUM(A1:A3)']],
        formulas: { engine: HyperFormula },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // Default: static pre-calculated value, not a formula object.
      expect(ws.getRow(4).getCell(1).value?.formula).toBeUndefined();
      // HyperFormula evaluates =SUM(A1:A3) to 6; exported as a string (no numeric type configured).
      expect(ws.getRow(4).getCell(1).value).toBe('6');
    });

    it('should offset cell references in formulas when column headers are exported', async() => {
      handsontable({
        data: [[10], [20], ['=SUM(A1:A2)']],
        colHeaders: ['Value'],
        formulas: { engine: HyperFormula },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // With one header row, data row 0 starts at Excel row 2.
      // HyperFormula formula =SUM(A1:A2) refers to HOT rows 0-1, which are Excel rows 2-3.
      const ws = await parseXlsx({ colHeaders: true, exportFormulas: true });

      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A2:A3)');
    });

    it('should offset column references when row headers are exported', async() => {
      handsontable({
        data: [[1, 2], [3, 4], ['=SUM(A1:A2)', '=SUM(B1:B2)']],
        rowHeaders: true,
        formulas: { engine: HyperFormula },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // With a row-header column, data column 0 maps to Excel column B (offset +1).
      const ws = await parseXlsx({ rowHeaders: true, exportFormulas: true });

      expect(ws.getRow(3).getCell(2).value?.formula).toBe('SUM(B1:B2)');
      expect(ws.getRow(3).getCell(3).value?.formula).toBe('SUM(C1:C2)');
    });

    it('should not treat non-formula string cells as formulas', async() => {
      handsontable({
        data: [['hello'], ['world'], ['SUM(A1:A2)']],
        formulas: { engine: HyperFormula },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Without a leading '=' these are plain strings, not formulas.
      expect(ws.getRow(3).getCell(1).value?.formula).toBeUndefined();
      expect(ws.getRow(3).getCell(1).value).toBe('SUM(A1:A2)');
    });

    it('should normalize the function argument separator from ";" to ","', async() => {
      // HyperFormula uses ";" as the separator in some locales; OOXML always uses ",".
      const hfInstance = HyperFormula.buildEmpty({ functionArgSeparator: ';' });

      handsontable({
        data: [[1], [2], [3], ['=SUM(A1:A3)']],
        formulas: { engine: HyperFormula, engineConfig: { functionArgSeparator: ';' } },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // Destroy the standalone instance — it was only used to confirm the API shape.
      hfInstance.destroy();

      const ws = await parseXlsx({ exportFormulas: true });

      // The formula separator must be "," in the exported OOXML.
      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A1:A3)');
    });

    it('should export an IF formula preserving the comma separator', async() => {
      handsontable({
        data: [[5], ['=IF(A1>3,"high","low")']],
        formulas: { engine: HyperFormula },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      expect(ws.getRow(2).getCell(1).value?.formula).toBe('IF(A1>3,"high","low")');
    });
  });
});
