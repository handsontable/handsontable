import ExcelJS from 'exceljs';

describe('exportFile XLSX type — features', () => {
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // No comment set — meta.comment is absent.
      expect(hot().getCellMeta(0, 0).comment).toBeUndefined();

      const { engine, getCapturedNote } = createNoteCapturingEngine(1, 1);

      await getPlugin('exportFile')._createTypeFormatter('xlsx', { engine }).export();

      expect(getCapturedNote()).toBeUndefined();
    });
  });

  describe('conditional formatting', () => {
    it('should attach a cellIs rule to the correct data range', async() => {
      handsontable({
        data: [[50], [150], [75]],
        columns: [{ type: 'numeric' }],
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // With one column-header row, data row 0 maps to Excel row 2.
      const ws = await parseXlsx({
        colHeaders: true,
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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
        exportFile: { engines: { xlsx: ExcelJS } },
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

    it('should apply per-sheet options (colHeaders) independently', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: ['Name', 'Score'],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container
        .handsontable({ data: createSpreadsheetData(1, 2), colHeaders: ['X', 'Y'] })
        .handsontable('getInstance');

      const sheets = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'WithHeaders', colHeaders: true },
          { instance: hot2, name: 'NoHeaders' },
        ],
      });

      // 'WithHeaders' has a header row — data in row 2.
      expect(sheets[0].getRow(1).getCell(1).value).toBe('Name');
      expect(sheets[0].getRow(2).getCell(1).value).toBe('A1');

      // 'NoHeaders' has no header row — data starts at row 1.
      expect(sheets[1].getRow(1).getCell(1).value).toBe('A1');
    });

    it('should honour the deprecated `columnHeaders` alias on per-sheet config objects', async() => {
      handsontable({
        data: createSpreadsheetData(1, 2),
        colHeaders: ['Name', 'Score'],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container
        .handsontable({ data: createSpreadsheetData(1, 2), colHeaders: ['X', 'Y'] })
        .handsontable('getInstance');

      // Use the deprecated `columnHeaders` key on both sheet configs instead of `colHeaders`.
      const sheets = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'WithHeaders', columnHeaders: true },
          { instance: hot2, name: 'NoHeaders', columnHeaders: false },
        ],
      });

      // 'WithHeaders' — deprecated alias must be promoted: header row is present, data in row 2.
      expect(sheets[0].getRow(1).getCell(1).value).toBe('Name');
      expect(sheets[0].getRow(2).getCell(1).value).toBe('A1');

      // 'NoHeaders' — explicitly false: data starts at row 1.
      expect(sheets[1].getRow(1).getCell(1).value).toBe('A1');
    });

    it('should fall back to sheet name "Sheet" when the name property is omitted', async() => {
      handsontable({
        data: [['a']],
        exportFile: { engines: { xlsx: ExcelJS } },
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

    it('should export correct data on the second export when cell values change between exports', async() => {
      // Regression guard: style caches must be cleared for all sheet instances before
      // each export so that CSS changes between exports are reflected correctly.
      // The cross-document case (instances in separate iframes) cannot be reproduced
      // in this test environment, but the same-document path is verified here.
      handsontable({
        data: [['first']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      hot2Container = $('<div></div>').appendTo('body');
      hot2 = hot2Container.handsontable({ data: [['first2']] }).handsontable('getInstance');

      const sheets1 = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'A' },
          { instance: hot2, name: 'B' },
        ],
      });

      expect(sheets1[0].getRow(1).getCell(1).value).toBe('first');
      expect(sheets1[1].getRow(1).getCell(1).value).toBe('first2');

      await setDataAtCell(0, 0, 'second');
      hot2.setDataAtCell(0, 0, 'second2');

      const sheets2 = await parseXlsxAllSheets({
        sheets: [
          { instance: hot(), name: 'A' },
          { instance: hot2, name: 'B' },
        ],
      });

      expect(sheets2[0].getRow(1).getCell(1).value).toBe('second');
      expect(sheets2[1].getRow(1).getCell(1).value).toBe('second2');
    });
  });

  describe('compression option', () => {
    it('should produce a valid XLSX buffer with compression level 1 (fastest)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ compression: 1 });

      expect(ws.rowCount).toBe(3);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should produce a valid XLSX buffer with compression level 9 (best)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ compression: 9 });

      expect(ws.rowCount).toBe(3);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should enable DEFLATE compression when compression is true (default level 6)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ compression: true });

      expect(ws.rowCount).toBe(3);
      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should produce the same cell data regardless of compression level', async() => {
      handsontable({
        data: [['hello', 42, true]],
        columns: [{ type: 'text' }, { type: 'numeric' }, { type: 'checkbox' }],
        exportFile: { engines: { xlsx: ExcelJS } },
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

});
