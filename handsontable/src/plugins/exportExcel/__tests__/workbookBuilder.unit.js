import { createWorkbook, normalizeCellValue } from '../workbookBuilder';

class WorksheetMock {
  rows = [];

  addRow(values) {
    this.rows.push(values);
  }
}

class WorkbookMock {
  worksheets = [];

  addWorksheet() {
    const worksheet = new WorksheetMock();

    this.worksheets.push(worksheet);

    return worksheet;
  }
}

describe('ExportExcel workbookBuilder', () => {
  describe('normalizeCellValue', () => {
    it('should export formula-like values as formulas when enabled', () => {
      expect(normalizeCellValue('=A1+B1', true)).toEqual({
        formula: 'A1+B1',
      });
      expect(normalizeCellValue('=', true)).toBe('=');
    });

    it('should keep formula-like values as plain text when disabled', () => {
      expect(normalizeCellValue('=A1+B1', false)).toBe('=A1+B1');
    });

    it('should stringify objects and normalize null-like values', () => {
      expect(normalizeCellValue({ foo: 'bar' })).toBe('[object Object]');
      expect(normalizeCellValue(null)).toBe('');
      expect(normalizeCellValue(undefined)).toBe('');
    });
  });

  describe('createWorkbook', () => {
    it('should prepend headers and map formulas', () => {
      const exceljs = {
        Workbook: WorkbookMock,
      };
      const workbook = createWorkbook(exceljs, {
        sheetName: 'Sheet 1',
        data: [['=A1+B1', 'B1'], ['A2', 'B2']],
        rowHeaders: [1, 2],
        columnHeaders: ['A', 'B'],
        formulas: true,
      });

      expect(workbook.worksheets[0].rows).toEqual([
        ['', 'A', 'B'],
        [1, { formula: 'A1+B1' }, 'B1'],
        [2, 'A2', 'B2'],
      ]);
    });
  });
});
