import ExcelJS from 'exceljs';

describe('exportFile XLSX type — layout', () => {
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

  describe('range export', () => {
    it('should export only the specified cell range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportHiddenRows: true });

      expect(ws.rowCount).toBe(4);
      expect(ws.getRow(2).getCell(1).value).toBe('A2');
      expect(ws.getRow(3).getCell(1).value).toBe('A3');
    });

    it('should include all rows and mark hidden rows as hidden in Excel when exportHiddenRows is "hide"', async() => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        hiddenRows: { rows: [1, 2] },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportHiddenRows: 'hide' });

      // All 4 rows are present.
      expect(ws.rowCount).toBe(4);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(2).getCell(1).value).toBe('A2');
      expect(ws.getRow(3).getCell(1).value).toBe('A3');
      expect(ws.getRow(4).getCell(1).value).toBe('A4');

      // Hidden rows are flagged as hidden in the workbook.
      expect(ws.getRow(2).hidden).toBe(true);
      expect(ws.getRow(3).hidden).toBe(true);

      // Visible rows are not hidden.
      expect(ws.getRow(1).hidden).toBeFalsy();
      expect(ws.getRow(4).hidden).toBeFalsy();
    });

    it('should preserve the configured row height for hidden rows when exportHiddenRows is "hide"', async() => {
      handsontable({
        data: createSpreadsheetData(3, 1),
        rowHeights: [23, 40, 23],
        hiddenRows: { rows: [1] },
        autoRowSize: false,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportHiddenRows: 'hide' });

      // Row 2 is hidden in HOT but should have a valid height in Excel (not 0).
      expect(ws.getRow(2).height).toBeGreaterThan(0);
      // 40px × 0.75 = 30pt
      expect(ws.getRow(2).height).toBe(30);
    });
  });

  describe('hidden columns', () => {
    it('should skip hidden columns by default', async() => {
      handsontable({
        data: createSpreadsheetData(1, 4),
        hiddenColumns: { columns: [1, 2] },
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportHiddenColumns: true });

      expect(ws.columnCount).toBe(4);
      expect(ws.getRow(1).getCell(2).value).toBe('B1');
      expect(ws.getRow(1).getCell(3).value).toBe('C1');
    });

    it('should include all columns and mark hidden columns as hidden in Excel when exportHiddenColumns is "hide"', async() => {
      handsontable({
        data: createSpreadsheetData(1, 4),
        hiddenColumns: { columns: [1, 2] },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportHiddenColumns: 'hide' });

      // All 4 columns are present.
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(1).getCell(2).value).toBe('B1');
      expect(ws.getRow(1).getCell(3).value).toBe('C1');
      expect(ws.getRow(1).getCell(4).value).toBe('D1');

      // Hidden columns are flagged as hidden in the workbook.
      expect(ws.getColumn(2).hidden).toBe(true);
      expect(ws.getColumn(3).hidden).toBe(true);

      // Visible columns are not hidden.
      expect(ws.getColumn(1).hidden).toBeFalsy();
      expect(ws.getColumn(4).hidden).toBeFalsy();
    });

    it('should preserve the configured column width for hidden columns when exportHiddenColumns is "hide"', async() => {
      handsontable({
        data: createSpreadsheetData(1, 3),
        colWidths: [50, 70, 50],
        hiddenColumns: { columns: [1] },
        autoColumnSize: false,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportHiddenColumns: 'hide' });

      // Column 2 is hidden in HOT but should have a valid width in Excel (not 0).
      expect(ws.getColumn(2).width).toBeGreaterThan(0);
      // 70px / 7 = 10 Excel units
      expect(ws.getColumn(2).width).toBe(10);
    });
  });

  describe('column widths', () => {
    it('should export column widths converted from pixels to Excel character-width units', async() => {
      handsontable({
        data: [['a', 'b']],
        colWidths: [70, 105],
        autoColumnSize: false,
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      // 2 frozen data rows + 1 header row = ySplit 3
      expect(ws.views[0].ySplit).toBe(3);
    });
  });

  describe('frozen columns', () => {
    it('should set xSplit to the number of frozen columns', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        fixedColumnsStart: 1,
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      const frozenView = (ws.views || []).find(v => v.state === 'frozen');

      expect(frozenView).toBeUndefined();
    });
  });

  describe('merged cells', () => {
    it('should export merged cells as an XLSX merge range', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      // Header occupies row 1, so data merge starts at row 2.
      expect(ws.model.merges).toContain('A2:B3');
    });

    it('should offset the merge range right by one column when row headers are exported', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ rowHeaders: true });

      // Row-header column occupies column A, so data merge starts at column B.
      expect(ws.model.merges).toContain('B1:C1');
    });

    it('should compress the merge rowspan when a hidden row inside the merge span is excluded', async() => {
      // Row 1 (0-based) is hidden and excluded (exportHiddenRows: false, the default).
      // The merge spans rows 0–2, so the exported data has rows 0 and 2 only.
      // The effective rowspan in the exported file should be 2 (not 3).
      handsontable({
        data: createSpreadsheetData(4, 3),
        hiddenRows: { rows: [1] },
        mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 1 }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // Exported rows: row 0 → excel row 1, row 2 → excel row 2, row 3 → excel row 3.
      // Merge covers rows 0–2 (export indices 0–1, excel rows 1–2).
      expect(ws.model.merges).toContain('A1:A2');
    });

    it('should compress the merge colspan when a hidden column inside the merge span is excluded', async() => {
      // Column 1 (0-based) is hidden and excluded.
      // The merge spans cols 0–2, so the exported data has cols 0 and 2 only.
      // The effective colspan in the exported file should be 2 (not 3).
      handsontable({
        data: createSpreadsheetData(3, 4),
        hiddenColumns: { columns: [1] },
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // Exported cols: col 0 → excel col 1, col 2 → excel col 2, col 3 → excel col 3.
      // Merge covers cols 0–2 (export indices 0–1, excel cols A–B).
      expect(ws.model.merges).toContain('A1:B1');
    });

    it('should shift the merge position when a hidden row before the merge is excluded', async() => {
      // Row 0 is hidden and excluded, so row 1 becomes the first row in the export.
      // A merge starting at row 1 should land at data-array row 0 (excel row 1).
      handsontable({
        data: createSpreadsheetData(4, 3),
        hiddenRows: { rows: [0] },
        mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 2 }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.model.merges).toContain('A1:B2');
    });
  });

  describe('RTL support', () => {
    it('should set rightToLeft on the worksheet view when layoutDirection is rtl', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        layoutDirection: 'rtl',
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.views[0]).toEqual(jasmine.objectContaining({ rightToLeft: true }));
    });

    it('should not set rightToLeft when layoutDirection is ltr', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        layoutDirection: 'ltr',
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
});
