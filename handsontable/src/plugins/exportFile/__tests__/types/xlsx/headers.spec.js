import ExcelJS from 'exceljs';

describe('exportFile XLSX type — headers', () => {
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

  describe('column headers', () => {
    it('should not include column headers by default', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.rowCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
    });

    it('should write column headers in the first row when enabled', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('A');
      expect(ws.getRow(1).getCell(2).value).toBe('B');
      expect(ws.getRow(2).getCell(1).value).toBe('A1');
    });

    it('should use custom column header labels when defined', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: ['Name', 'Age'],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('Name');
      expect(ws.getRow(1).getCell(2).value).toBe('Age');
    });
  });

  describe('row headers', () => {
    it('should not include row headers by default', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        rowHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.columnCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
    });

    it('should write row headers in the first column when enabled', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        rowHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true, rowHeaders: true });

      expect(ws.getRow(1).getCell(1).value).toBe('');
      expect(ws.getRow(1).getCell(2).value).toBe('A');
      expect(ws.getRow(1).getCell(3).value).toBe('B');
      expect(ws.getRow(2).getCell(1).value).toBe(1);
      expect(ws.getRow(2).getCell(2).value).toBe('A1');
    });
  });

  describe('header style', () => {
    const DEFAULT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    const DEFAULT_BORDER_SIDE = { style: 'thin' };
    const DEFAULT_BORDER = {
      top: DEFAULT_BORDER_SIDE,
      bottom: DEFAULT_BORDER_SIDE,
      left: DEFAULT_BORDER_SIDE,
      right: DEFAULT_BORDER_SIDE,
    };

    it('should apply the default light-grey background and thin border to column headers', async() => {
      handsontable({
        data: [['A', 'B']],
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });
      const headerCell = ws.getRow(1).getCell(1);

      expect(headerCell.fill).toEqual(DEFAULT_FILL);
      expect(headerCell.border).toEqual(DEFAULT_BORDER);
    });

    it('should apply the default light-grey background and thin border to row headers', async() => {
      handsontable({
        data: [['A']],
        rowHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // Row header is in column 1; data row 1 is Excel row 1 (no column headers).
      const ws = await parseXlsx({ rowHeaders: true });
      const rowHeaderCell = ws.getRow(1).getCell(1);

      expect(rowHeaderCell.fill).toEqual(DEFAULT_FILL);
      expect(rowHeaderCell.border).toEqual(DEFAULT_BORDER);
    });

    it('should apply the default style to the corner cell when both header types are enabled', async() => {
      handsontable({
        data: [['A']],
        colHeaders: true,
        rowHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // Corner cell: row 1 (header row), col 1 (row-header column).
      const ws = await parseXlsx({ colHeaders: true, rowHeaders: true });
      const cornerCell = ws.getRow(1).getCell(1);

      expect(cornerCell.fill).toEqual(DEFAULT_FILL);
      expect(cornerCell.border).toEqual(DEFAULT_BORDER);
    });

    it('should apply a custom header background color when configured', async() => {
      handsontable({
        data: [['A']],
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true, headerStyle: { backgroundColor: '#4472C4' } });

      expect(ws.getRow(1).getCell(1).fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      });
    });

    it('should apply a custom header border style and color when configured', async() => {
      handsontable({
        data: [['A']],
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({
        colHeaders: true,
        headerStyle: { border: { style: 'medium', color: '#FF0000' } },
      });
      const expectedSide = { style: 'medium', color: { argb: 'FFFF0000' } };

      expect(ws.getRow(1).getCell(1).border).toEqual({
        top: expectedSide, bottom: expectedSide, left: expectedSide, right: expectedSide,
      });
    });

    it('should not apply any style when headerStyle is null', async() => {
      handsontable({
        data: [['A']],
        colHeaders: true,
        rowHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true, rowHeaders: true, headerStyle: null });

      // No fill or border should be set on either the corner cell or a column header cell.
      expect(ws.getRow(1).getCell(1).fill).toBeUndefined();
      expect(ws.getRow(1).getCell(1).border).toBeUndefined();
      expect(ws.getRow(1).getCell(2).fill).toBeUndefined();
      expect(ws.getRow(1).getCell(2).border).toBeUndefined();
    });

    it('should suppress the border when headerStyle.border is null', async() => {
      handsontable({
        data: [['A']],
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({
        colHeaders: true,
        headerStyle: { backgroundColor: '#F2F2F2', border: null },
      });

      expect(ws.getRow(1).getCell(1).fill).toEqual(DEFAULT_FILL);
      // ExcelJS may return an empty sentinel {} when another property is set — check no sides exist.
      expect(ws.getRow(1).getCell(1).border?.top).toBeUndefined();
    });

    it('should not apply header fill or border to data cells', async() => {
      handsontable({
        data: [['A', 'B']],
        colHeaders: true,
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });
      // Data row starts at row 2 when column headers are exported.
      const dataCell = ws.getRow(2).getCell(1);

      // Data cell should have no fill (ExcelJS default sentinel has no fgColor) or border.
      expect(dataCell.fill?.fgColor).toBeUndefined();
      expect(dataCell.border).toBeUndefined();
    });

    it('should apply the default style to all nested header rows', async() => {
      handsontable({
        data: [['A']],
        nestedHeaders: [['Parent'], ['Child']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      expect(ws.getRow(1).getCell(1).fill).toEqual(DEFAULT_FILL);
      expect(ws.getRow(1).getCell(1).border).toEqual(DEFAULT_BORDER);
      expect(ws.getRow(2).getCell(1).fill).toEqual(DEFAULT_FILL);
      expect(ws.getRow(2).getCell(1).border).toEqual(DEFAULT_BORDER);
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'center' })
      );
    });

    it('should not set alignment when headerClassName contains no alignment class', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        colHeaders: ['No align'],
        columns: [{ headerClassName: 'custom-class' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toBeUndefined();
    });

    it('should not set alignment when headerClassName is not configured', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        colHeaders: ['Header'],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      expect(ws.getRow(1).getCell(1).alignment).toBeUndefined();
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true, rowHeaders: true });

      // The row-header column (A) should be merged across the 2 nested header rows.
      expect(ws.model.merges).toContain('A1:A2');
      // Data starts at row 3, column B.
      expect(ws.getRow(3).getCell(2).value).toBe('A1');
    });

    it('should not export nested headers when colHeaders option is false', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        nestedHeaders: [
          ['Group', 'Other'],
          ['A', 'B'],
        ],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // colHeaders is false — data should start at row 1.
      expect(ws.rowCount).toBe(2);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
    });

    it('should export spanning header label and colspan for a hidden column when exportHiddenColumns is "hide"', async() => {
      // Col 1 is hidden. 'Group B' spans cols 1-2 (origColspan=2).
      // With 'hide', both cols appear in the export and 'Group B' should
      // still span 2 columns with the correct label.
      handsontable({
        data: createSpreadsheetData(1, 3),
        nestedHeaders: [
          ['Group A', { label: 'Group B', colspan: 2 }],
          ['Col 1', 'Col 2', 'Col 3'],
        ],
        hiddenColumns: { columns: [1] },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true, exportHiddenColumns: 'hide' });

      // All 3 data columns are present (data starts at row 3 due to 2 header rows).
      expect(ws.getRow(3).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(2).value).toBe('B1');
      expect(ws.getRow(3).getCell(3).value).toBe('C1');

      // First header row: 'Group A' at col 1, 'Group B' spanning cols 2-3.
      expect(ws.getRow(1).getCell(1).value).toBe('Group A');
      expect(ws.getRow(1).getCell(2).value).toBe('Group B');
      expect(ws.model.merges).toContain('B1:C1');

      // Second header row: leaf headers including the hidden column's label.
      expect(ws.getRow(2).getCell(1).value).toBe('Col 1');
      expect(ws.getRow(2).getCell(2).value).toBe('Col 2');
      expect(ws.getRow(2).getCell(3).value).toBe('Col 3');
    });

    it('should reduce span and omit hidden leaf label when hidden column is excluded', async() => {
      // Col 1 is hidden. With exportHiddenColumns: false (default), 'Group B'
      // should shrink to colspan=1 and 'Col 2' should be omitted.
      handsontable({
        data: createSpreadsheetData(1, 3),
        nestedHeaders: [
          ['Group A', { label: 'Group B', colspan: 2 }],
          ['Col 1', 'Col 2', 'Col 3'],
        ],
        hiddenColumns: { columns: [1] },
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ colHeaders: true });

      // Only 2 data columns are present (hidden column omitted).
      expect(ws.getRow(3).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(2).value).toBe('C1');
      expect(ws.getRow(3).getCell(3).value).toBeNull();

      // 'Group B' shrinks to colspan 1 — no merge should exist for it.
      expect(ws.getRow(1).getCell(2).value).toBe('Group B');
      expect(ws.model.merges ?? []).not.toContain('B1:C1');

      // Hidden leaf header 'Col 2' is absent.
      expect(ws.getRow(2).getCell(2).value).toBe('Col 3');
    });
  });
});
