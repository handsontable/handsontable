/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { MAX_INPUT_BYTES, MAX_WORKBOOK_CELLS } from '../limits';

function load(name) {
  const bytes = readFileSync(join(__dirname, 'fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function read(name) {
  const dropped = new DroppedFeatures();
  const snapshot = await excelJsAdapter.read(load(name), ExcelJS, dropped);

  return { snapshot, dropped, sheet: snapshot.sheets[0] };
}

describe('excelJsAdapter.read', () => {
  it('should read primitive values with their number formats, dates back as serials', async() => {
    const { sheet, dropped } = await read('values');
    const row = sheet.rows[1];

    expect(sheet.name).toBe('Values');
    expect(sheet.rows[0].map(c => c.value)).toEqual(['Name', 'Amount', 'Active', 'Hired', 'Start', 'Ratio']);
    expect(row[0].value).toBe('Ana García');
    expect(row[1]).toEqual(expect.objectContaining({ value: 4200.5, numFmt: '#,##0.00' }));
    expect(row[2].value).toBe(true);
    expect(row[3]).toEqual(expect.objectContaining({ value: 45292, numFmt: 'mm-dd-yy' }));
    expect(row[4].value).toBeCloseTo(0.5208333, 6);
    expect(row[4].numFmt).toBe('h:mm:ss');
    expect(row[5]).toEqual(expect.objectContaining({ value: 0.034, numFmt: '0.0%' }));
    expect(sheet.rows[3][1]).toBeNull();
    // Row 4 was written with only column A set (`ws.getRow(4).values = ['Li Wei']`), so ExcelJS's
    // own `row.eachCell({ includeEmpty: true })` only reaches column A — the read has to pad the
    // row to the sheet's full width itself, with real `null`s rather than leaving holes.
    expect(sheet.rows[3].length).toBe(6);
    expect(sheet.rows[3][5]).toBeNull();
    expect(dropped.list()).toEqual([]);
  });

  it('should read widths, heights, hidden rows and columns, merges, freeze and rtl', async() => {
    const { sheet } = await read('layout');

    expect(sheet.colWidths[0]).toBe(5);
    expect(sheet.colWidths[1]).toBe(20);
    // Column F (width) and column G (hidden) sit past the last populated column, so
    // `worksheet.columnCount` — the widest populated row, 4 here — never reaches them. Reading the
    // column layout up to `columnCount` alone leaves `colWidths` four entries long and
    // `hiddenCols` at `[2]`.
    expect(sheet.colWidths[5]).toBe(15);
    expect(sheet.hiddenCols).toEqual([2, 6]);
    expect(sheet.colWidths.length).toBe(7);
    expect(sheet.rowHeights[1]).toBe(30);
    expect(sheet.hiddenRows).toEqual([3]);
    expect(sheet.merges).toEqual([
      { row: 0, col: 0, rowspan: 1, colspan: 2 },
      { row: 2, col: 2, rowspan: 2, colspan: 2 },
    ]);
    expect(sheet.freeze).toEqual({ rows: 1, cols: 1 });
    expect(sheet.rtl).toBe(true);
    expect(sheet.rows[0][1]).toBeNull();
  });

  it('should read styles, comments and protection', async() => {
    const { sheet } = await read('styles');
    const [a1, b1, c1, d1, e1] = sheet.rows[0];

    expect(a1.style.font).toEqual(expect.objectContaining({ bold: true, color: { argb: 'FFFF0000' } }));
    expect(b1.style.fill).toEqual(expect.objectContaining({ fgColor: { argb: 'FF00FF00' } }));
    expect(c1.style.border.top).toEqual(expect.objectContaining({ style: 'thin' }));
    expect(d1.style.alignment).toEqual({ horizontal: 'center', vertical: 'middle' });
    expect(e1.comment).toBe('a comment');
    // A2 was written with `protection: { locked: true }`, which equals the OOXML default (a cell
    // is locked unless told otherwise). ExcelJS's own ProtectionXform never round-trips that: its
    // `isSignificant` parse check (`!model.locked || model.hidden`) treats "locked, not hidden" as
    // nothing to record, so the file carries no `<protection>` element for A2 at all and reading it
    // back is indistinguishable from a cell whose lock was never set — `locked` stays `null`.
    expect(sheet.rows[1][0].locked).toBeNull();
    expect(sheet.rows[1][1].locked).toBe(false);
    expect(sheet.protection).toEqual(expect.objectContaining({ enabled: true }));
  });

  it('should read list validations and drop the kinds the model has no room for', async() => {
    const { sheet, snapshot, dropped } = await read('validation');

    expect(sheet.rows[0][0].validation).toEqual({
      type: 'list', allowBlank: true, formulae: ['\'_HotValidation\'!$A$1:$A$2'],
    });
    expect(sheet.rows[0][1].validation.formulae).toEqual(['"a,b,c"']);
    expect(sheet.rows[0][2].validation).toBeNull();
    expect(dropped.list()).toEqual(['dataValidation:whole']);
    expect(snapshot.sheets[1].state).toBe('veryHidden');
  });

  it('should read formulas with and without cached results and conditional formatting', async() => {
    const { sheet } = await read('formulas');

    expect(sheet.rows[2][0]).toEqual(
      expect.objectContaining({ value: null, formula: { text: 'SUM(A1:A2)', result: 5 } }),
    );
    expect(sheet.rows[2][1].formula).toEqual({ text: 'A3*2' });
    // C1:C2 is a shared formula (`ws.fillFormula('C1:C2', 'A1*2', [4, 6])`). The slave's raw value
    // carries `sharedFormula: 'C1'` — the master's address, not an expression — so the text has to
    // come from ExcelJS's own translated `cell.formula` getter, not from the raw value.
    expect(sheet.rows[0][2].formula).toEqual({ text: 'A1*2', result: 4 });
    expect(sheet.rows[1][2].formula).toEqual({ text: 'A2*2', result: 6 });
    expect(sheet.conditionalFormatting[0].ref).toBe('A1:A3');
  });

  it('should read every sheet with its visibility', async() => {
    const { snapshot } = await read('multi-sheet');

    expect(snapshot.sheets.map(s => [s.name, s.state])).toEqual([
      ['First', 'visible'], ['Second', 'hidden'], ['Third', 'veryHidden'],
    ]);
  });

  it('should keep a hole row and a height-only row without padding either with cells', async() => {
    const { sheet } = await read('sparse');

    expect(sheet.rows.length).toBe(4);
    expect(sheet.rows[0].map(cell => cell.value)).toEqual(['first', 'second']);
    // Row 2 has no `<row>` element at all and row 3 carries only a height, so neither may cost a
    // full width of `null`s — and neither may be left as a hole the mapper would index into.
    expect(sheet.rows[1]).toEqual([]);
    expect(sheet.rows[2]).toEqual([]);
    expect(sheet.rowHeights[2]).toBe(42);
    expect(sheet.rowHeights[1]).toBeNull();
    // A row that does carry cells is still padded to the sheet's width.
    expect(sheet.rows[3].length).toBe(2);
    expect(sheet.rows[3][1]).toBeNull();
  });

  it('should report the lossy reads the model has no room for', async() => {
    const { sheet, dropped } = await read('lossy');

    expect(sheet.rows[0][0].value).toBe('Handsontable');
    expect(sheet.rows[0][1].value).toBe('bold plain');
    // A hyperlink whose text is itself a rich-text run list keeps the text the runs spell, rather
    // than reading back as an empty cell.
    expect(sheet.rows[1][0].value).toBe('Handsontable docs');
    expect(dropped.list().sort()).toEqual(
      ['autoFilter', 'hyperlink', 'images', 'richText', 'sheetProtection:password', 'tables'],
    );
    // The password itself is never recoverable — the file carries a salted hash — so the model must
    // not claim one.
    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
    expect(sheet.protection.options).not.toHaveProperty('hashValue');
    expect(sheet.protection.options).not.toHaveProperty('algorithmName');
  });

  it('should not count a sheet-wide column declaration against the cell limit', async() => {
    // Excel writes one `<col min="1" max="16384"/>` for any sheet-wide width or style, and ExcelJS
    // expands it into 16384 `Column` objects. Multiplying the row count by THAT refuses this 10 kB,
    // 400-row, one-column file as "400 × 16384 cells".
    const { sheet } = await read('wide-columns');

    expect(sheet.rows.length).toBe(400);
    // The cell matrix is sized by the widest populated row, never by the column declarations.
    expect(sheet.rows[0].length).toBe(1);
    expect(sheet.rows[0][0].value).toBe('r1');
    // The column layout still reaches the declaration, so a width on column 16384 survives.
    expect(sheet.colWidths.length).toBe(16384);
    expect(sheet.colWidths[16383]).toBe(12);
  });

  it('should refuse a real file whose declared row count cannot be materialized', async() => {
    // One cell at a far address is enough: ExcelJS creates the sparse row on write, so the file
    // stays tiny (a few kB) while the sheet it declares does not.
    const workbook = new ExcelJS.Workbook();

    workbook.addWorksheet('Huge').getCell(1048577, 1).value = 'x';

    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    await expect(excelJsAdapter.read(buffer, ExcelJS, new DroppedFeatures()))
      .rejects.toThrow(/sheet "Huge" declares 1048577 rows, above the 1048576-row limit/);
  });

  it('should refuse a sheet whose declared column count or cell count cannot be materialized', async() => {
    // ExcelJS's own `getCell` refuses column 16385 on write, so the column and cell-count caps can
    // only be reached through a worksheet that declares the size without holding it — which is
    // exactly the shape a hostile file produces after `load()`.
    const stubModule = (rowCount, columnCount, columnsLength = 0) => ({
      Workbook: class StubWorkbook {
        constructor() {
          this.worksheets = [{
            name: 'Huge',
            state: 'visible',
            rowCount,
            columnCount,
            columns: columnsLength > 0 ? new Array(columnsLength) : undefined,
            findRow: () => undefined,
            getColumn: () => ({}),
            views: [],
            conditionalFormattings: [],
          }];
          this.xlsx = { load: async() => {} };
        }
      },
    });
    const readWith = module => excelJsAdapter.read(new ArrayBuffer(0), module, new DroppedFeatures());

    await expect(readWith(stubModule(1, 16385)))
      .rejects.toThrow(/declares 16385 columns, above the 16384-column limit/);
    // The declared columns count too, so a trailing layout-only column cannot smuggle the size past.
    await expect(readWith(stubModule(1, 4, 16385)))
      .rejects.toThrow(/declares 16385 columns, above the 16384-column limit/);
    await expect(readWith(stubModule(5000, 1001)))
      .rejects.toThrow(/declares 5000 × 1001 cells, above the 5000000-cell limit/);
    // A sheet inside every limit is still read.
    await expect(readWith(stubModule(0, 0))).resolves.toEqual(
      expect.objectContaining({ sheets: [expect.objectContaining({ name: 'Huge' })] }),
    );
  });

  it('should refuse an input buffer above the byte cap before handing it to the engine', async() => {
    // The size caps below run after the engine has parsed the file; the byte cap is the only
    // guard that runs before it.
    const engine = { Workbook: class { constructor() { throw new Error('must not be constructed'); } } };

    await expect(excelJsAdapter.read(new ArrayBuffer(MAX_INPUT_BYTES + 1), engine, new DroppedFeatures()))
      .rejects.toThrow(/bytes, above the .*-byte limit/);
  });

  it('should refuse a workbook whose sheets together exceed the workbook cell budget', async() => {
    // Each sheet sits inside the per-sheet caps; only their sum is out of bounds.
    const perSheetRows = 1000000;
    const sheetsNeeded = Math.floor(MAX_WORKBOOK_CELLS / perSheetRows) + 1;
    const engine = {
      Workbook: class {
        constructor() {
          this.worksheets = Array.from({ length: sheetsNeeded }, (_, index) => ({
            name: `S${index}`,
            state: 'visible',
            rowCount: perSheetRows,
            columnCount: 1,
            findRow: () => undefined,
            getColumn: () => ({}),
            views: [],
            conditionalFormattings: [],
          }));
          this.xlsx = { load: async() => {} };
        }
      },
    };

    await expect(excelJsAdapter.read(new ArrayBuffer(0), engine, new DroppedFeatures()))
      .rejects.toThrow(/workbook declares .* cells across its sheets, above the .*-cell limit/);
  });

  it('should count a sheet\'s column layout against the workbook budget even with no rows', async() => {
    // Each sheet declares `<col max="16384"/>` and no rows, so the cell matrix costs nothing while
    // `readColumnLayout` allocates 16384 entries per sheet.
    const sheetsNeeded = Math.floor(MAX_WORKBOOK_CELLS / 16384) + 1;
    const engine = {
      Workbook: class {
        constructor() {
          this.worksheets = Array.from({ length: sheetsNeeded }, (_, index) => ({
            name: `L${index}`,
            state: 'visible',
            rowCount: 0,
            columnCount: 0,
            columns: new Array(16384),
            findRow: () => undefined,
            getColumn: () => ({}),
            views: [],
            conditionalFormattings: [],
          }));
          this.xlsx = { load: async() => {} };
        }
      },
    };

    await expect(excelJsAdapter.read(new ArrayBuffer(0), engine, new DroppedFeatures()))
      .rejects.toThrow(/workbook declares .* cells across its sheets/);
  });

  it('should take a merge\'s extent from every cell in it, not only from the master downwards', async() => {
    // A well-formed file puts the master top-left; a hand-crafted one need not.
    const master = { row: 2, col: 2 };
    const mergedCell = (row, col) => ({
      row,
      col,
      value: null,
      type: 1,
      isMerged: true,
      master,
      formula: undefined,
      numFmt: undefined,
      font: undefined,
      fill: undefined,
      border: undefined,
      alignment: undefined,
      protection: undefined,
      dataValidation: undefined,
      note: undefined,
    });
    const rows = {
      1: { eachCell: (_o, cb) => { cb(mergedCell(1, 1), 1); cb(mergedCell(1, 2), 2); }, cellCount: 2 },
      2: { eachCell: (_o, cb) => { cb(mergedCell(2, 1), 1); cb({ ...mergedCell(2, 2), type: 2 }, 2); }, cellCount: 2 },
    };
    const engine = {
      Workbook: class {
        constructor() {
          this.worksheets = [{
            name: 'M',
            state: 'visible',
            rowCount: 2,
            columnCount: 2,
            findRow: n => rows[n],
            getColumn: () => ({}),
            views: [],
            conditionalFormattings: [],
          }];
          this.xlsx = { load: async() => {} };
        }
      },
      ValueType: { Merge: 1 },
    };

    const { sheets: [sheet] } = await excelJsAdapter.read(new ArrayBuffer(0), engine, new DroppedFeatures());

    expect(sheet.merges).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 2 }]);
  });

  it('should reject a buffer that is not a workbook', async() => {
    const dropped = new DroppedFeatures();

    await expect(excelJsAdapter.read(new Uint8Array([1, 2, 3]).buffer, ExcelJS, dropped))
      .rejects.toThrow(/could not be parsed/);
  });
});
