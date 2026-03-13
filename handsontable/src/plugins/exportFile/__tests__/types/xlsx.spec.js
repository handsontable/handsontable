import ExcelJS from 'exceljs';
import HyperFormula from 'hyperformula';

describe('exportFile XLSX type', () => {
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

  /**
   * Exports the current Handsontable instance as XLSX and loads it back with ExcelJS.
   *
   * @param {object} [options] Export options passed to `_createTypeFormatter`.
   * @returns {Promise<object>} The first worksheet in the exported workbook.
   */
  async function parseXlsx(options = {}) {
    const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx', options).export();
    const wb = new ExcelJS.Workbook();

    await wb.xlsx.load(buffer);

    return wb.worksheets[0];
  }

  describe('default options', () => {
    it('should have the correct default options', async() => {
      handsontable({ exportFile: { engine: ExcelJS } });

      const formatter = getPlugin('exportFile')._createTypeFormatter('xlsx');

      expect(formatter.options.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(formatter.options.fileExtension).toBe('xlsx');
      expect(formatter.options.bom).toBe(false);
      expect(formatter.options.columnHeaders).toBe(false);
      expect(formatter.options.rowHeaders).toBe(false);
      expect(formatter.options.exportHiddenColumns).toBe(false);
      expect(formatter.options.exportHiddenRows).toBe(false);
      expect(formatter.options.range).toEqual([]);
      expect(formatter.options.exportFormulas).toBe(false);
    });

    it('should mark the format as binary', async() => {
      handsontable({ exportFile: { engine: ExcelJS } });

      const formatter = getPlugin('exportFile')._createTypeFormatter('xlsx');

      expect(formatter.constructor.BINARY).toBe(true);
    });
  });

  describe('`export()` method', () => {
    it('should return a Promise', async() => {
      handsontable({
        data: [['A1']],
        exportFile: { engine: ExcelJS },
      });

      const result = getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      expect(result instanceof Promise).toBe(true);

      await result;
    });

    it('should resolve with a binary buffer', async() => {
      handsontable({
        data: [['A1']],
        exportFile: { engine: ExcelJS },
      });

      const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      // ExcelJS returns a Buffer (Uint8Array subclass) in browser environments.
      expect(buffer instanceof Uint8Array).toBe(true);
    });
  });

  describe('`exportAsString` method', () => {
    it('should throw when called for the xlsx format', async() => {
      handsontable({
        data: [['A1']],
        exportFile: { engine: ExcelJS },
      });

      expect(() => getPlugin('exportFile').exportAsString('xlsx')).toThrow();
    });
  });

  describe('`exportAsBlob` method', () => {
    it('should return a Promise that resolves to a Blob with the correct MIME type', async() => {
      handsontable({
        data: [['A1']],
        exportFile: { engine: ExcelJS },
      });

      const result = getPlugin('exportFile').exportAsBlob('xlsx');

      expect(result instanceof Promise).toBe(true);

      const blob = await result;

      expect(blob instanceof Blob).toBe(true);
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  });

  describe('cell data', () => {
    it('should export string cell values', async() => {
      handsontable({
        data: [['Hello', 'World']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('Hello');
      expect(ws.getRow(1).getCell(2).value).toBe('World');
    });

    it('should export null and undefined cells as null', async() => {
      handsontable({
        data: [[null, undefined]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBeNull();
      expect(ws.getRow(1).getCell(2).value).toBeNull();
    });

    it('should export a multi-row, multi-column table', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(1).getCell(3).value).toBe('C1');
      expect(ws.getRow(3).getCell(1).value).toBe('A3');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should export numeric type cells as JavaScript numbers', async() => {
      handsontable({
        data: [[42, '3.14']],
        columns: [
          { type: 'numeric' },
          { type: 'numeric' },
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(42);
      expect(ws.getRow(1).getCell(2).value).toBe(3.14);
    });

    it('should export non-parseable values in numeric type cells as strings', async() => {
      handsontable({
        data: [['not-a-number']],
        columns: [{ type: 'numeric' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('not-a-number');
    });

    it('should export non-numeric type cells as strings', async() => {
      handsontable({
        data: [[123]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('123');
    });
  });

  describe('column headers', () => {
    it('should not include column headers by default', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.rowCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
    });

    it('should write column headers in the first row when enabled', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('A');
      expect(ws.getRow(1).getCell(2).value).toBe('B');
      expect(ws.getRow(2).getCell(1).value).toBe('A1');
    });

    it('should use custom column header labels when defined', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: ['Name', 'Age'],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('Name');
      expect(ws.getRow(1).getCell(2).value).toBe('Age');
    });
  });

  describe('row headers', () => {
    it('should not include row headers by default', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        rowHeaders: true,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.columnCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
    });

    it('should write row headers in the first column when enabled', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        rowHeaders: true,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ rowHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe(1);
      expect(ws.getRow(1).getCell(2).value).toBe('A1');
      expect(ws.getRow(2).getCell(1).value).toBe(2);
    });

    it('should use custom row header labels when defined', async() => {
      handsontable({
        data: createSpreadsheetData(2, 1),
        rowHeaders: ['Row A', 'Row B'],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ rowHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('Row A');
      expect(ws.getRow(2).getCell(1).value).toBe('Row B');
    });
  });

  describe('column and row headers combined', () => {
    it('should leave the corner cell (A1) empty and offset data to B2', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        rowHeaders: true,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true, rowHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('');
      expect(ws.getRow(1).getCell(2).value).toBe('A');
      expect(ws.getRow(1).getCell(3).value).toBe('B');
      expect(ws.getRow(2).getCell(1).value).toBe(1);
      expect(ws.getRow(2).getCell(2).value).toBe('A1');
    });
  });

  describe('range export', () => {
    it('should export only the specified cell range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ range: [1, 1, 2, 2] });

      expect(ws.rowCount).toBe(2);
      expect(ws.columnCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('B2');
      expect(ws.getRow(2).getCell(2).value).toBe('C3');
    });

    it('should clamp an out-of-bounds range to the table dimensions', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ range: [2, 2, 99, 99] });

      expect(ws.rowCount).toBe(1);
      expect(ws.columnCount).toBe(1);
      expect(ws.getRow(1).getCell(1).value).toBe('C3');
    });
  });

  describe('hidden rows', () => {
    it('should skip hidden rows by default', async() => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        hiddenRows: { rows: [1, 2] },
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.rowCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(2).getCell(1).value).toBe('A4');
    });

    it('should include hidden rows when exportHiddenRows is true', async() => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        hiddenRows: { rows: [1, 2] },
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportHiddenRows: true });

      expect(ws.rowCount).toBe(4);
      expect(ws.getRow(2).getCell(1).value).toBe('A2');
      expect(ws.getRow(3).getCell(1).value).toBe('A3');
    });
  });

  describe('hidden columns', () => {
    it('should skip hidden columns by default', async() => {
      handsontable({
        data: createSpreadsheetData(1, 4),
        hiddenColumns: { columns: [1, 2] },
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.columnCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(1).getCell(2).value).toBe('D1');
    });

    it('should include hidden columns when exportHiddenColumns is true', async() => {
      handsontable({
        data: createSpreadsheetData(1, 4),
        hiddenColumns: { columns: [1, 2] },
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportHiddenColumns: true });

      expect(ws.columnCount).toBe(4);
      expect(ws.getRow(1).getCell(2).value).toBe('B1');
      expect(ws.getRow(1).getCell(3).value).toBe('C1');
    });
  });

  describe('date type cells', () => {
    it('should export a `date` type cell as an Excel date serial (recognized as Date category in Excel)', async() => {
      handsontable({
        data: [['2016-02-28']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      // ExcelJS reads a serial + date numFmt back as a JavaScript Date object.
      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCFullYear()).toBe(2016);
      expect(cell.value.getUTCMonth()).toBe(1);
      expect(cell.value.getUTCDate()).toBe(28);
    });

    it('should apply the mm-dd-yy numFmt to date cells', async() => {
      handsontable({
        data: [['2020-01-15']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).numFmt).toBe('mm-dd-yy');
    });

    it('should export an `intl-date` type cell as an Excel date', async() => {
      handsontable({
        data: [['2023-07-04']],
        columns: [{ type: 'intl-date' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCFullYear()).toBe(2023);
      expect(cell.value.getUTCMonth()).toBe(6);
      expect(cell.value.getUTCDate()).toBe(4);
    });

    it('should export an empty date cell as null', async() => {
      handsontable({
        data: [[null]],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBeNull();
    });

    it('should fall back to a plain string when the value is not a valid ISO 8601 date', async() => {
      handsontable({
        data: [['not-a-date']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('not-a-date');
    });
  });

  describe('cell alignment', () => {
    it('should export htLeft className as horizontal left alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htLeft' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'left' })
      );
    });

    it('should export htCenter className as horizontal center alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htCenter' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'center' })
      );
    });

    it('should export htRight className as horizontal right alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htRight' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'right' })
      );
    });

    it('should export htJustify className as horizontal justify alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htJustify' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'justify' })
      );
    });

    it('should export htTop className as vertical top alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htTop' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ vertical: 'top' })
      );
    });

    it('should export htMiddle className as vertical middle alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htMiddle' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ vertical: 'middle' })
      );
    });

    it('should export htBottom className as vertical bottom alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htBottom' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ vertical: 'bottom' })
      );
    });

    it('should export combined horizontal and vertical alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htRight htTop' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual({
        horizontal: 'right',
        vertical: 'top',
      });
    });

    it('should not set alignment when no alignment className is present', async() => {
      handsontable({
        data: [['text']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toBeUndefined();
    });
  });

  describe('cell borders', () => {
    it('should export a top border with the correct ARGB color', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#FF0000' },
        }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const { border } = ws.getRow(1).getCell(1);

      expect(border.top).toEqual({ style: 'thin', color: { argb: 'FFFF0000' } });
      expect(border.bottom).toBeUndefined();
      expect(border.left).toBeUndefined();
      expect(border.right).toBeUndefined();
    });

    it('should export all four borders with their respective colors', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#FF0000' },
          bottom: { width: 1, color: '#00FF00' },
          left: { width: 1, color: '#0000FF' },
          right: { width: 1, color: '#AABBCC' },
        }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const { border } = ws.getRow(1).getCell(1);

      expect(border.top).toEqual({ style: 'thin', color: { argb: 'FFFF0000' } });
      expect(border.bottom).toEqual({ style: 'thin', color: { argb: 'FF00FF00' } });
      expect(border.left).toEqual({ style: 'thin', color: { argb: 'FF0000FF' } });
      expect(border.right).toEqual({ style: 'thin', color: { argb: 'FFAABBCC' } });
    });

    it('should not set a border when no custom border is defined', async() => {
      handsontable({
        data: [['text']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).border).toBeUndefined();
    });

    it('should convert a 3-character hex color to ARGB', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#F0A' },
        }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // #F0A expands to #FF00AA → FFFF00AA
      expect(ws.getRow(1).getCell(1).border.top.color.argb).toBe('FFFF00AA');
    });
  });

  describe('cell comments', () => {
    /**
     * Returns a proxy engine that wraps ExcelJS and captures the `note` value
     * set on the cell at (targetRow, targetCol) — both 1-based.
     *
     * @param {number} targetRow
     * @param {number} targetCol
     * @returns {{ engine: object, getCapturedNote: Function }}
     */
    function createNoteCapturingEngine(targetRow, targetCol) {
      let capturedNote;

      const engine = {
        // eslint-disable-next-line object-shorthand
        Workbook: function() {
          const wb = new ExcelJS.Workbook();
          const origAddWorksheet = wb.addWorksheet.bind(wb);

          wb.addWorksheet = function(...args) {
            const ws = origAddWorksheet(...args);
            const origGetRow = ws.getRow.bind(ws);

            ws.getRow = function(rowNumber) {
              const row = origGetRow(rowNumber);
              const origGetCell = row.getCell.bind(row);

              row.getCell = function(colNumber) {
                const cell = origGetCell(colNumber);

                if (rowNumber === targetRow && colNumber === targetCol) {
                  Object.defineProperty(cell, 'note', {
                    set(v) { capturedNote = v; },
                    get() { return capturedNote; },
                    configurable: true,
                  });
                }

                return cell;
              };

              return row;
            };

            return ws;
          };

          return wb;
        },
      };

      return { engine, getCapturedNote: () => capturedNote };
    }

    it('should write the comment value as an Excel note', async() => {
      handsontable({
        data: [['text']],
        exportFile: { engine: ExcelJS },
      });

      // Set the comment directly in cell meta — the same data path xlsx.js reads.
      hot().setCellMeta(0, 0, 'comment', { value: 'Test note' });

      const { engine, getCapturedNote } = createNoteCapturingEngine(1, 1);

      await getPlugin('exportFile')._createTypeFormatter('xlsx', { engine }).export();

      expect(getCapturedNote()).toBe('Test note');
    });

    it('should not write a note when the cell has no comment', async() => {
      handsontable({
        data: [['text']],
        exportFile: { engine: ExcelJS },
      });

      // No comment set — meta.comment is absent.
      expect(hot().getCellMeta(0, 0).comment).toBeUndefined();

      const { engine, getCapturedNote } = createNoteCapturingEngine(1, 1);

      await getPlugin('exportFile')._createTypeFormatter('xlsx', { engine }).export();

      expect(getCapturedNote()).toBeUndefined();
    });
  });

  describe('merged cells', () => {
    it('should export merged cells as an XLSX merge range', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.model.merges).toContain('A1:B2');
      // The master cell retains its value.
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      // Slave cells have type Merge (8).
      expect(ws.getCell(1, 2).type).toBe(ExcelJS.ValueType.Merge);
      expect(ws.getCell(2, 1).type).toBe(ExcelJS.ValueType.Merge);
    });

    it('should offset the merge range down by one row when column headers are exported', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      // Header occupies row 1, so data merge starts at row 2.
      expect(ws.model.merges).toContain('A2:B3');
    });

    it('should offset the merge range right by one column when row headers are exported', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ rowHeaders: true });

      // Row-header column occupies column A, so data merge starts at column B.
      expect(ws.model.merges).toContain('B1:C1');
    });
  });

  describe('column widths', () => {
    it('should export column widths converted from pixels to Excel character-width units', async() => {
      handsontable({
        data: [['a', 'b']],
        colWidths: [70, 105],
        autoColumnSize: false,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // 70px / 7 = 10 units, 105px / 7 = 15 units
      expect(ws.getColumn(1).width).toBe(10);
      expect(ws.getColumn(2).width).toBe(15);
    });

    it('should clamp column widths to a minimum of 1 Excel unit', async() => {
      handsontable({
        data: [['a']],
        colWidths: [3],
        autoColumnSize: false,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // 3px / 7 ≈ 0.43 → clamped to 1
      expect(ws.getColumn(1).width).toBe(1);
    });

    it('should prepend a narrow column for row headers when row headers are exported', async() => {
      handsontable({
        data: [['a']],
        rowHeaders: true,
        autoColumnSize: false,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ rowHeaders: true });

      // Column 1 is the row-header column, rendered with a fixed default width.
      expect(ws.getColumn(1).width).toBeGreaterThan(0);
      // Column 2 is the first data column.
      expect(ws.getColumn(2).width).toBeGreaterThan(0);
    });
  });

  describe('row heights', () => {
    it('should export row heights converted from pixels to Excel points', async() => {
      handsontable({
        data: [['a'], ['b']],
        rowHeights: [40, 60],
        autoRowSize: false,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // 40px * 0.75 = 30pt, 60px * 0.75 = 45pt
      expect(ws.getRow(1).height).toBe(30);
      expect(ws.getRow(2).height).toBe(45);
    });
  });

  describe('frozen rows', () => {
    it('should set ySplit to the number of frozen rows', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        fixedRowsTop: 2,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.views[0]).toEqual(jasmine.objectContaining({
        state: 'frozen',
        ySplit: 2,
      }));
    });

    it('should add 1 to ySplit to account for the column header row', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        fixedRowsTop: 2,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      // 2 frozen data rows + 1 header row = ySplit 3
      expect(ws.views[0].ySplit).toBe(3);
    });
  });

  describe('frozen columns', () => {
    it('should set xSplit to the number of frozen columns', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        fixedColumnsStart: 1,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.views[0]).toEqual(jasmine.objectContaining({
        state: 'frozen',
        xSplit: 1,
      }));
    });

    it('should add 1 to xSplit to account for the row header column', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        rowHeaders: true,
        fixedColumnsStart: 1,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ rowHeaders: true });

      // 1 frozen data column + 1 row-header column = xSplit 2
      expect(ws.views[0].xSplit).toBe(2);
    });
  });

  describe('frozen rows and columns combined', () => {
    it('should set both xSplit and ySplit', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        fixedRowsTop: 1,
        fixedColumnsStart: 2,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.views[0].xSplit).toBe(2);
      expect(ws.views[0].ySplit).toBe(1);
    });
  });

  describe('no frozen panes', () => {
    it('should not produce a frozen-pane view when no rows or columns are frozen', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      const frozenView = (ws.views || []).find(v => v.state === 'frozen');

      expect(frozenView).toBeUndefined();
    });
  });

  describe('multiselect type cells', () => {
    it('should export a multiselect cell as a comma-separated string of selected values', async() => {
      handsontable({
        data: [[['red', 'green']]],
        columns: [{ type: 'multiselect', source: ['red', 'green', 'blue'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('red, green');
    });

    it('should export key-value object selections using their display value', async() => {
      handsontable({
        data: [[
          [{ key: 'r', value: 'red' }, { key: 'b', value: 'blue' }],
        ]],
        columns: [{
          type: 'multiselect',
          source: [{ key: 'r', value: 'red' }, { key: 'g', value: 'green' }, { key: 'b', value: 'blue' }],
        }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('red, blue');
    });

    it('should export an empty multiselect cell as null', async() => {
      handsontable({
        data: [[null]],
        columns: [{ type: 'multiselect', source: ['a', 'b'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBeNull();
    });

    it('should not add data validation for multiselect cells', async() => {
      // Excel has no native multi-select type. Adding a single-value list
      // validation would flag every multi-selected cell as invalid because the
      // comma-separated string ('red, green') is not in the source list.
      handsontable({
        data: [[['red', 'green']]],
        columns: [{ type: 'multiselect', source: ['red', 'green', 'blue'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).dataValidation).toBeUndefined();
    });
  });

  describe('read-only cells', () => {
    it('should apply the default light gray background to a read-only cell', async() => {
      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const { fill } = ws.getRow(1).getCell(1);

      expect(fill.type).toBe('pattern');
      expect(fill.pattern).toBe('solid');
      // Default read-only background is #F0F0F0
      expect(fill.fgColor.argb).toBe('FFF0F0F0');
    });

    it('should apply the default dimmed text color to a read-only cell', async() => {
      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // Default read-only text color is #808080
      expect(ws.getRow(1).getCell(1).font?.color?.argb).toBe('FF808080');
    });

    it('should prefer an explicit backgroundColor over the read-only default', async() => {
      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true, backgroundColor: '#FFD700' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).fill?.fgColor?.argb).toBe('FFFFD700');
    });

    it('should prefer an explicit font color over the read-only default', async() => {
      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true, font: { color: '#0000FF' } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).font?.color?.argb).toBe('FF0000FF');
    });

    it('should not apply read-only styling to a non-read-only cell', async() => {
      handsontable({
        data: [['editable']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).fill).toBeUndefined();
      expect(ws.getRow(1).getCell(1).font).toBeUndefined();
    });
  });

  describe('column header className styling', () => {
    it('should apply alignment from headerClassName to regular column header cells', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: ['Left', 'Right'],
        columns: [
          { headerClassName: 'htLeft' },
          { headerClassName: 'htRight' },
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'left' })
      );
      expect(ws.getRow(1).getCell(2).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'right' })
      );
    });

    it('should apply alignment from headerClassName to nested column header cells', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        nestedHeaders: [
          [{ label: 'Centered', colspan: 2, headerClassName: 'htCenter' }],
          ['A', 'B'],
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'center' })
      );
    });

    it('should not set alignment when headerClassName contains no alignment class', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        colHeaders: ['No align'],
        columns: [{ headerClassName: 'custom-class' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toBeUndefined();
    });

    it('should not set alignment when headerClassName is not configured', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        colHeaders: ['Header'],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toBeUndefined();
    });
  });

  /**
   * Exports the current Handsontable instance as XLSX and loads all worksheets back.
   *
   * @param {object} [options] Export options passed to `_createTypeFormatter`.
   * @returns {Promise<object[]>} All worksheets in the exported workbook.
   */
  async function parseXlsxAllSheets(options = {}) {
    const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx', options).export();
    const wb = new ExcelJS.Workbook();

    await wb.xlsx.load(buffer);

    return wb.worksheets;
  }

  describe('engine injection', () => {
    it('should use the engine configured in the plugin-level settings', async() => {
      handsontable({
        data: [['a']],
        exportFile: { engine: ExcelJS },
      });

      // No per-call engine option — reads from plugin settings.
      const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      expect(buffer instanceof Uint8Array).toBe(true);
    });

    it('should allow a per-call engine option to override the plugin-level setting', async() => {
      handsontable({
        data: [['a']],
        // Plugin-level engine deliberately absent.
      });

      const buffer = await getPlugin('exportFile')
        ._createTypeFormatter('xlsx', { engine: ExcelJS })
        .export();

      expect(buffer instanceof Uint8Array).toBe(true);
    });

    it('should throw when no engine is configured at any level', async() => {
      handsontable({
        data: [['a']],
      });

      // Calling export() (not the constructor) throws when engine is missing.
      const formatter = getPlugin('exportFile')._createTypeFormatter('xlsx');

      expect(() => formatter.export()).toThrow();
    });
  });

  describe('time type cells', () => {
    it('should export a `time` type cell as an Excel time serial with hh:mm:ss numFmt', async() => {
      handsontable({
        data: [['12:30:00']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      // 12:30:00 = (12*3600 + 30*60) / 86400 = 45000/86400 ≈ 0.520833…
      // ExcelJS reads a fractional-day serial + time numFmt back as a Date object.
      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCHours()).toBe(12);
      expect(cell.value.getUTCMinutes()).toBe(30);
      expect(cell.value.getUTCSeconds()).toBe(0);
    });

    it('should apply the hh:mm:ss numFmt to time cells', async() => {
      handsontable({
        data: [['08:05:30']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).numFmt).toBe('hh:mm:ss');
    });

    it('should export midnight (00:00:00) correctly', async() => {
      handsontable({
        data: [['00:00:00']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCHours()).toBe(0);
      expect(cell.value.getUTCMinutes()).toBe(0);
      expect(cell.value.getUTCSeconds()).toBe(0);
    });

    it('should export a 12-hour time string with AM/PM', async() => {
      handsontable({
        data: [['3:45:00 PM']],
        columns: [{ type: 'time', timeFormat: 'h:mm:ss A' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCHours()).toBe(15);
      expect(cell.value.getUTCMinutes()).toBe(45);
    });

    it('should fall back to a plain string when the value is not a valid time', async() => {
      handsontable({
        data: [['not-a-time']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('not-a-time');
    });
  });

  describe('checkbox type cells', () => {
    it('should export a checked checkbox as boolean true', async() => {
      handsontable({
        data: [[true]],
        columns: [{ type: 'checkbox' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(true);
    });

    it('should export an unchecked checkbox as boolean false', async() => {
      handsontable({
        data: [[false]],
        columns: [{ type: 'checkbox' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(false);
    });

    it('should use a custom checkedTemplate to determine the boolean value', async() => {
      handsontable({
        data: [['yes'], ['no']],
        columns: [{ type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(true);
      expect(ws.getRow(2).getCell(1).value).toBe(false);
    });
  });

  describe('dropdown / autocomplete cells', () => {
    it('should add an Excel list data validation for a `dropdown` type cell', async() => {
      handsontable({
        data: [['Option A']],
        columns: [{ type: 'dropdown', source: ['Option A', 'Option B', 'Option C'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const validation = ws.getRow(1).getCell(1).dataValidation;

      expect(validation.type).toBe('list');
      expect(validation.formulae).toEqual(['"Option A,Option B,Option C"']);
      expect(validation.allowBlank).toBe(true);
    });

    it('should add a list validation for an `autocomplete` type cell', async() => {
      handsontable({
        data: [['red']],
        columns: [{ type: 'autocomplete', source: ['red', 'green', 'blue'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const validation = ws.getRow(1).getCell(1).dataValidation;

      expect(validation.type).toBe('list');
      expect(validation.formulae).toEqual(['"red,green,blue"']);
    });

    it('should not add data validation when source is a function', async() => {
      handsontable({
        data: [['dynamic']],
        columns: [{ type: 'dropdown', source: () => ['a', 'b'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).dataValidation).toBeUndefined();
    });

    it('should not add data validation for a plain text cell', async() => {
      handsontable({
        data: [['plain']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).dataValidation).toBeUndefined();
    });
  });

  describe('cell font styling', () => {
    it('should export bold font when meta.font.bold is true', async() => {
      handsontable({
        data: [['Bold text']],
        cell: [{ row: 0, col: 0, font: { bold: true } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).font).toEqual(jasmine.objectContaining({ bold: true }));
    });

    it('should export italic font when meta.font.italic is true', async() => {
      handsontable({
        data: [['Italic text']],
        cell: [{ row: 0, col: 0, font: { italic: true } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).font).toEqual(jasmine.objectContaining({ italic: true }));
    });

    it('should export underline when meta.font.underline is true', async() => {
      handsontable({
        data: [['Underline text']],
        cell: [{ row: 0, col: 0, font: { underline: true } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // ExcelJS stores underline as a string ('single') or boolean after round-trip.
      expect(ws.getRow(1).getCell(1).font?.underline).toBeTruthy();
    });

    it('should export font color when meta.font.color is set', async() => {
      handsontable({
        data: [['Red text']],
        cell: [{ row: 0, col: 0, font: { color: '#FF0000' } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).font?.color?.argb).toBe('FFFF0000');
    });

    it('should export combined bold, italic, and color', async() => {
      handsontable({
        data: [['styled']],
        cell: [{ row: 0, col: 0, font: { bold: true, italic: true, color: '#0000FF' } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const { font } = ws.getRow(1).getCell(1);

      expect(font.bold).toBe(true);
      expect(font.italic).toBe(true);
      expect(font.color.argb).toBe('FF0000FF');
    });

    it('should not set font when meta.font is absent', async() => {
      handsontable({
        data: [['plain']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).font).toBeUndefined();
    });
  });

  describe('cell background color', () => {
    it('should export a solid fill with the correct ARGB color', async() => {
      handsontable({
        data: [['highlighted']],
        cell: [{ row: 0, col: 0, backgroundColor: '#FFCC00' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const { fill } = ws.getRow(1).getCell(1);

      expect(fill.type).toBe('pattern');
      expect(fill.pattern).toBe('solid');
      expect(fill.fgColor.argb).toBe('FFFFCC00');
    });

    it('should expand a 3-digit hex background color to ARGB', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, backgroundColor: '#F00' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).fill?.fgColor?.argb).toBe('FFFF0000');
    });

    it('should not set fill when meta.backgroundColor is absent', async() => {
      handsontable({
        data: [['plain']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).fill).toBeUndefined();
    });
  });

  describe('RTL support', () => {
    it('should set rightToLeft on the worksheet view when layoutDirection is rtl', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        layoutDirection: 'rtl',
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.views[0]).toEqual(jasmine.objectContaining({ rightToLeft: true }));
    });

    it('should not set rightToLeft when layoutDirection is ltr', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        layoutDirection: 'ltr',
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      const rtlView = (ws.views || []).find(v => v.rightToLeft === true);

      expect(rtlView).toBeUndefined();
    });

    it('should combine rightToLeft with frozen panes when both are configured', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        layoutDirection: 'rtl',
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.views[0]).toEqual(jasmine.objectContaining({
        rightToLeft: true,
        state: 'frozen',
        xSplit: 1,
        ySplit: 1,
      }));
    });
  });

  describe('nested column headers', () => {
    it('should export two-level nested headers as two header rows', async() => {
      handsontable({
        data: createSpreadsheetData(2, 3),
        nestedHeaders: [
          ['Group A', { label: 'Group B', colspan: 2 }],
          ['Col 1', 'Col 2', 'Col 3'],
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      // First header layer
      expect(ws.getRow(1).getCell(1).value).toBe('Group A');
      expect(ws.getRow(1).getCell(2).value).toBe('Group B');
      // Second header layer
      expect(ws.getRow(2).getCell(1).value).toBe('Col 1');
      expect(ws.getRow(2).getCell(2).value).toBe('Col 2');
      expect(ws.getRow(2).getCell(3).value).toBe('Col 3');
    });

    it('should merge cells for spanning nested headers', async() => {
      handsontable({
        data: createSpreadsheetData(1, 3),
        nestedHeaders: [
          ['A', { label: 'Span', colspan: 2 }],
          ['B', 'C', 'D'],
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      // 'Span' spans columns 2-3 in Excel (B1:C1)
      expect(ws.model.merges).toContain('B1:C1');
    });

    it('should push data rows below all nested header rows', async() => {
      handsontable({
        data: [['value']],
        nestedHeaders: [
          ['Top'],
          ['Bottom'],
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true });

      // With 2 header rows, data starts at row 3.
      expect(ws.getRow(3).getCell(1).value).toBe('value');
    });

    it('should leave the corner cell empty and merge it when row headers are combined with nested headers', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'Both', colspan: 2 }],
          ['Col 1', 'Col 2'],
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ columnHeaders: true, rowHeaders: true });

      // The row-header column (A) should be merged across the 2 nested header rows.
      expect(ws.model.merges).toContain('A1:A2');
      // Data starts at row 3, column B.
      expect(ws.getRow(3).getCell(2).value).toBe('A1');
    });

    it('should not export nested headers when columnHeaders option is false', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        nestedHeaders: [
          ['Group', 'Other'],
          ['A', 'B'],
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // columnHeaders is false — data should start at row 1.
      expect(ws.rowCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
    });
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
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const summaryCell = ws.getRow(4).getCell(1);

      // ExcelJS stores formula cells as { formula, result }.
      expect(summaryCell.value?.formula).toBe('SUM(A1:A3)');
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
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportFormulas: true });
      const cell = ws.getRow(3).getCell(1);

      // Static value — not a formula object.
      expect(typeof cell.value).not.toBe('object');
      expect(cell.value).toBe('99');
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
        exportFile: { engine: ExcelJS },
      });

      // With one header row, data row 0 maps to Excel row 2, so the
      // source range A1:A2 in data space becomes A2:A3 in Excel.
      const ws = await parseXlsx({ columnHeaders: true, exportFormulas: true });

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
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Rows 0-1 and row 3 → A1:A2 and A4.
      expect(ws.getRow(5).getCell(1).value?.formula).toBe('SUM(A1:A2,A4)');
    });

    it('should export the static value when ColumnSummary plugin is not enabled', async() => {
      handsontable({
        data: [[10], [20], [30]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // No summaries configured — plain numeric strings.
      expect(ws.getRow(1).getCell(1).value).toBe('10');
      expect(ws.getRow(3).getCell(1).value).toBe('30');
    });
  });

  describe('conditional formatting', () => {
    it('should attach a cellIs rule to the correct data range', async() => {
      handsontable({
        data: [[50], [150], [75]],
        columns: [{ type: 'numeric' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({
        conditionalFormatting: [{
          rules: [{
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: [100],
            style: {
              font: { color: { argb: 'FFFF0000' } },
            },
          }],
        }],
      });

      // With no headers and no row-header column, data starts at A1.
      // The full data range is A1:A3.
      const cf = ws.conditionalFormattings;

      expect(cf.length).toBeGreaterThan(0);
      expect(cf[0].ref).toBe('A1:A3');
      expect(cf[0].rules[0].type).toBe('cellIs');
      expect(cf[0].rules[0].operator).toBe('greaterThan');
    });

    it('should restrict the CF range when `rows` and `cols` are specified', async() => {
      handsontable({
        data: [[1, 2], [3, 4], [5, 6]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({
        conditionalFormatting: [{
          rows: [1, 2],
          cols: [0, 0],
          rules: [{ type: 'containsText', operator: 'containsText', text: 'x', style: {} }],
        }],
      });

      // rows [1,2] → Excel rows 2-3, cols [0,0] → Excel col A.
      const cf = ws.conditionalFormattings;

      expect(cf.length).toBeGreaterThan(0);
      expect(cf[0].ref).toBe('A2:A3');
    });

    it('should offset the CF range when column headers are exported', async() => {
      handsontable({
        data: [[10], [20]],
        colHeaders: ['Value'],
        columns: [{ type: 'numeric' }],
        exportFile: { engine: ExcelJS },
      });

      // With one column-header row, data row 0 maps to Excel row 2.
      const ws = await parseXlsx({
        columnHeaders: true,
        conditionalFormatting: [{
          rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: [15], style: {} }],
        }],
      });

      const cf = ws.conditionalFormattings;

      // Data is in A2:A3 (header in row 1).
      expect(cf[0].ref).toBe('A2:A3');
    });

    it('should offset the CF range when row headers are exported', async() => {
      handsontable({
        data: [[10], [20]],
        rowHeaders: true,
        columns: [{ type: 'numeric' }],
        exportFile: { engine: ExcelJS },
      });

      // With a row-header column, data column 0 maps to Excel column B.
      const ws = await parseXlsx({
        rowHeaders: true,
        conditionalFormatting: [{
          rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: [15], style: {} }],
        }],
      });

      const cf = ws.conditionalFormattings;

      // Data is in B1:B2 (row-header in column A).
      expect(cf[0].ref).toBe('B1:B2');
    });

    it('should not add conditional formatting when the option is an empty array', async() => {
      handsontable({
        data: [[1]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ conditionalFormatting: [] });

      expect(ws.conditionalFormattings.length).toBe(0);
    });
  });

  describe('multiple sheets export', () => {
    let hot2Container;
    let hot2;

    afterEach(() => {
      if (hot2) {
        hot2.destroy();
        hot2 = null;
      }
      if (hot2Container) {
        hot2Container.remove(); // jQuery .remove()
        hot2Container = null;
      }
    });

    it('should create one worksheet per entry in the `sheets` option', async() => {
      handsontable({
        data: [['Sheet1-A1']],
        exportFile: { engine: ExcelJS },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container.handsontable({ data: [['Sheet2-A1']] }).handsontable('getInstance');

      const sheets = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'Sales' },
          { instance: hot2, name: 'Inventory' },
        ],
      });

      expect(sheets.length).toBe(2);
      expect(sheets[0].name).toBe('Sales');
      expect(sheets[1].name).toBe('Inventory');
    });

    it('should write correct data to each worksheet', async() => {
      handsontable({
        data: [['Alice', 100]],
        exportFile: { engine: ExcelJS },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container.handsontable({ data: [['Widget', 50]] }).handsontable('getInstance');

      const sheets = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'People' },
          { instance: hot2, name: 'Products' },
        ],
      });

      expect(sheets[0].getRow(1).getCell(1).value).toBe('Alice');
      expect(sheets[0].getRow(1).getCell(2).value).toBe('100');
      expect(sheets[1].getRow(1).getCell(1).value).toBe('Widget');
      expect(sheets[1].getRow(1).getCell(2).value).toBe('50');
    });

    it('should apply per-sheet options (columnHeaders) independently', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: ['Name', 'Score'],
        exportFile: { engine: ExcelJS },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container
        .handsontable({ data: createSpreadsheetData(1, 2), colHeaders: ['X', 'Y'] })
        .handsontable('getInstance');

      const sheets = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'WithHeaders', columnHeaders: true },
          { instance: hot2, name: 'NoHeaders' },
        ],
      });

      // 'WithHeaders' has a header row — data in row 2.
      expect(sheets[0].getRow(1).getCell(1).value).toBe('Name');
      expect(sheets[0].getRow(2).getCell(1).value).toBe('A1');

      // 'NoHeaders' has no header row — data starts at row 1.
      expect(sheets[1].getRow(1).getCell(1).value).toBe('A1');
    });

    it('should fall back to sheet name "Sheet" when the name property is omitted', async() => {
      handsontable({
        data: [['a']],
        exportFile: { engine: ExcelJS },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container.handsontable({ data: [['b']] }).handsontable('getInstance');

      const sheets = await parseXlsxAllSheets({
        sheets: [
          { instance: hot() },
          { instance: hot2 },
        ],
      });

      expect(sheets[0].name).toBe('Sheet');
      expect(sheets[1].name).toBe('Sheet1');
    });
  });

  describe('compression option', () => {
    it('should produce a valid XLSX buffer with compression level 1 (fastest)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ compression: 1 });

      expect(ws.rowCount).toBe(3);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should produce a valid XLSX buffer with compression level 9 (best)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ compression: 9 });

      expect(ws.rowCount).toBe(3);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should produce the same cell data regardless of compression level', async() => {
      handsontable({
        data: [['hello', 42, true]],
        columns: [{ type: 'text' }, { type: 'numeric' }, { type: 'checkbox' }],
        exportFile: { engine: ExcelJS },
      });

      const [wsDefault, wsMin, wsMax] = await Promise.all([
        parseXlsx(),
        parseXlsx({ compression: 1 }),
        parseXlsx({ compression: 9 }),
      ]);

      for (const ws of [wsMin, wsMax]) {
        expect(ws.getRow(1).getCell(1).value).toBe(wsDefault.getRow(1).getCell(1).value);
        expect(ws.getRow(1).getCell(2).value).toBe(wsDefault.getRow(1).getCell(2).value);
        expect(ws.getRow(1).getCell(3).value).toBe(wsDefault.getRow(1).getCell(3).value);
      }
    });
  });

  describe('progress notification', () => {
    it('should call onProgress with phase "start" before any rows', async() => {
      handsontable({
        data: createSpreadsheetData(3, 2),
        exportFile: { engine: ExcelJS },
      });

      const calls = [];
      const onProgress = info => calls.push({ ...info });

      await getPlugin('exportFile')._createTypeFormatter('xlsx', { onProgress }).export();

      expect(calls[0]).toEqual({ phase: 'start', current: 0, total: 3, percent: 0 });
    });

    it('should call onProgress with phase "rows" after each data row', async() => {
      handsontable({
        data: createSpreadsheetData(3, 2),
        exportFile: { engine: ExcelJS },
      });

      const calls = [];
      const onProgress = info => calls.push({ ...info });

      await getPlugin('exportFile')._createTypeFormatter('xlsx', { onProgress }).export();

      const rowCalls = calls.filter(c => c.phase === 'rows');

      expect(rowCalls.length).toBe(3);
      expect(rowCalls[0]).toEqual({ phase: 'rows', current: 1, total: 3, percent: 33 });
      expect(rowCalls[1]).toEqual({ phase: 'rows', current: 2, total: 3, percent: 67 });
      expect(rowCalls[2]).toEqual({ phase: 'rows', current: 3, total: 3, percent: 100 });
    });

    it('should call onProgress with phase "complete" last', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        exportFile: { engine: ExcelJS },
      });

      const calls = [];
      const onProgress = info => calls.push({ ...info });

      await getPlugin('exportFile')._createTypeFormatter('xlsx', { onProgress }).export();

      const lastCall = calls[calls.length - 1];

      expect(lastCall).toEqual({ phase: 'complete', current: 1, total: 1, percent: 100 });
    });

    it('should track progress across all sheets in multi-sheet mode', async() => {
      let hot3Container;
      let hot3;

      try {
        handsontable({
          data: createSpreadsheetData(2, 1),
          exportFile: { engine: ExcelJS },
        });

        hot3Container = $('<div></div>').appendTo('body');
        hot3 = hot3Container
          .handsontable({ data: createSpreadsheetData(3, 1) })
          .handsontable('getInstance');

        const calls = [];
        const onProgress = info => calls.push({ ...info });

        await getPlugin('exportFile')._createTypeFormatter('xlsx', {
          onProgress,
          sheets: [
            { instance: hot(), name: 'First' },
            { instance: hot3, name: 'Second' },
          ],
        }).export();

        // Total across both sheets: 2 + 3 = 5 rows.
        const startCall = calls.find(c => c.phase === 'start');
        const rowCalls = calls.filter(c => c.phase === 'rows');

        expect(startCall.total).toBe(5);
        expect(rowCalls.length).toBe(5);
        // After the last row of the second sheet, current should equal total.
        expect(rowCalls[rowCalls.length - 1].current).toBe(5);

      } finally {
        if (hot3) {
          hot3.destroy();
        }
        if (hot3Container) {
          hot3Container.remove();
        }
      }
    });

    it('should not call onProgress when no callback is provided', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        exportFile: { engine: ExcelJS },
      });

      // Should complete without errors when onProgress is absent.
      const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      expect(buffer instanceof Uint8Array).toBe(true);
    });
  });

  describe('`exportFormulas` option — HyperFormula integration', () => {
    it('should export a HyperFormula formula cell as a live Excel formula when `exportFormulas` is true', async() => {
      handsontable({
        data: [[1], [2], [3], ['=SUM(A1:A3)']],
        formulas: { engine: HyperFormula },
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // Row 4 contains the formula cell; data starts at Excel row 1 (no headers).
      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A1:A3)');
    });

    it('should export the calculated value when `exportFormulas` is false (default)', async() => {
      handsontable({
        data: [[1], [2], [3], ['=SUM(A1:A3)']],
        formulas: { engine: HyperFormula },
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
      });

      // With one header row, data row 0 starts at Excel row 2.
      // HyperFormula formula =SUM(A1:A2) refers to HOT rows 0-1, which are Excel rows 2-3.
      const ws = await parseXlsx({ columnHeaders: true, exportFormulas: true });

      expect(ws.getRow(4).getCell(1).value?.formula).toBe('SUM(A2:A3)');
    });

    it('should offset column references when row headers are exported', async() => {
      handsontable({
        data: [[1, 2], [3, 4], ['=SUM(A1:A2)', '=SUM(B1:B2)']],
        rowHeaders: true,
        formulas: { engine: HyperFormula },
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
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
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      expect(ws.getRow(2).getCell(1).value?.formula).toBe('IF(A1>3,"high","low")');
    });
  });
});
