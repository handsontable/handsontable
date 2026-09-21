/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { MAX_INPUT_BYTES } from '../limits';

function load(name) {
  const bytes = readFileSync(join(__dirname, 'fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function read(name) {
  const dropped = new DroppedFeatures();
  const snapshot = await nativeAdapter.read(load(name), undefined, dropped);

  return { snapshot, dropped, sheet: snapshot.sheets[0] };
}

describe('nativeAdapter.read', () => {
  it('should read primitive values with their number formats, dates as serials', async() => {
    const { sheet, dropped } = await read('values');
    const row = sheet.rows[1];

    expect(sheet.name).toBe('Values');
    expect(sheet.rows[0].map(c => c.value)).toEqual(['Name', 'Amount', 'Active', 'Hired', 'Start', 'Ratio']);
    expect(row[0].value).toBe('Ana García');
    expect(row[1].value).toBe(4200.5);
    expect(row[1].numFmt).toBe('#,##0.00');
    expect(row[2].value).toBe(true);
    expect(row[3].value).toBe(45292);
    expect(row[3].numFmt).toBe('mm-dd-yy');
    expect(row[4].value).toBeCloseTo(0.5208333, 6);
    expect(row[4].numFmt).toBe('h:mm:ss');
    expect(row[5].value).toBe(0.034);
    expect(row[5].numFmt).toBe('0.0%');
    expect(sheet.rows[3].length).toBe(6);
    expect(sheet.rows[3][1]).toBeNull();
    expect(sheet.rows[3][5]).toBeNull();
    expect(dropped.list()).toEqual([]);
  });

  it('should read widths, heights, hidden rows and columns, merges, freeze and rtl', async() => {
    const { sheet } = await read('layout');

    expect(sheet.colWidths[0]).toBe(5);
    expect(sheet.colWidths[1]).toBe(20);
    expect(sheet.colWidths[5]).toBe(15);
    expect(sheet.colWidths.length).toBe(7);
    expect(sheet.hiddenCols).toEqual([2, 6]);
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
    const row = sheet.rows[0];

    expect(row[0].style.font).toEqual({ bold: true, color: { argb: 'FFFF0000' } });
    expect(row[1].style.fill).toEqual({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } });
    expect(row[2].style.border.top).toEqual({ style: 'thin', color: { argb: 'FF0000FF' } });
    expect(row[3].style.alignment).toEqual({ horizontal: 'center', vertical: 'middle' });
    expect(row[4].comment).toBe('a comment');
    // ExcelJS writes no <protection> for `locked: true` (the OOXML default), so it reads back null.
    expect(sheet.rows[1][0].locked).toBeNull();
    expect(sheet.rows[1][1].locked).toBe(false);
    expect(sheet.protection.enabled).toBe(true);
  });

  it('should read list validations and drop the kinds the model has no room for', async() => {
    const { snapshot, sheet, dropped } = await read('validation');

    expect(sheet.rows[0][0].validation.formulae).toEqual(['\'_HotValidation\'!$A$1:$A$2']);
    expect(sheet.rows[0][1].validation.formulae).toEqual(['"a,b,c"']);
    expect(sheet.rows[0][2].validation).toBeNull();
    expect(dropped.list()).toEqual(['dataValidation:whole']);
    expect(snapshot.sheets[1].state).toBe('veryHidden');
  });

  it('should read formulas with and without cached results, shared formulas and conditional formatting', async() => {
    const { sheet } = await read('formulas');

    expect(sheet.rows[2][0]).toEqual(
      expect.objectContaining({ value: null, formula: { text: 'SUM(A1:A2)', result: 5 } }),
    );
    expect(sheet.rows[2][1].formula).toEqual({ text: 'A3*2' });
    expect(sheet.rows[0][2].formula).toEqual({ text: 'A1*2', result: 4 });
    expect(sheet.rows[1][2].formula).toEqual({ text: 'A2*2', result: 6 });
    expect(sheet.conditionalFormatting[0].ref).toBe('A1:A3');
    expect(sheet.conditionalFormatting[0].rules[0]).toEqual(expect.objectContaining({
      type: 'cellIs', operator: 'greaterThan', formulae: ['2'], style: { font: { bold: true } },
    }));
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
    expect(sheet.rows[1]).toEqual([]);
    expect(sheet.rows[2]).toEqual([]);
    expect(sheet.rowHeights[2]).toBe(42);
    expect(sheet.rowHeights[1]).toBeNull();
    expect(sheet.rows[3].length).toBe(2);
    expect(sheet.rows[3][1]).toBeNull();
  });

  it('should report the lossy reads the model has no room for', async() => {
    const { sheet, dropped } = await read('lossy');

    expect(sheet.rows[0][0].value).toBe('Handsontable');
    expect(sheet.rows[0][1].value).toBe('bold plain');
    expect(sheet.rows[1][0].value).toBe('Handsontable docs');
    expect(dropped.list().sort()).toEqual([
      'autoFilter', 'hyperlink', 'images', 'richText', 'sheetProtection:password', 'tables',
    ]);
    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
    expect(sheet.protection.options).not.toHaveProperty('hashValue');
  });

  it('should not count a sheet-wide column declaration against the cell limit', async() => {
    const { sheet } = await read('wide-columns');

    expect(sheet.rows.length).toBe(400);
    expect(sheet.rows[0].length).toBe(1);
    expect(sheet.rows[0][0].value).toBe('r1');
    expect(sheet.colWidths.length).toBe(16384);
    expect(sheet.colWidths[16383]).toBe(12);
  });

  it('should refuse a real file whose declared row count cannot be materialized', async() => {
    const workbook = new ExcelJS.Workbook();

    workbook.addWorksheet('Huge').getCell(1048577, 1).value = 1;

    const bytes = await workbook.xlsx.writeBuffer();

    await expect(nativeAdapter.read(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), undefined, new DroppedFeatures(),
    )).rejects.toThrow(/sheet "Huge" declares 1048577 rows, above the 1048576-row limit/);
  });

  it('should refuse an input buffer above the byte cap before opening it', async() => {
    await expect(nativeAdapter.read(new ArrayBuffer(MAX_INPUT_BYTES + 1), undefined, new DroppedFeatures()))
      .rejects.toThrow(/bytes, above the .*-byte limit/);
  });

  it('should reject a buffer that is not a workbook', async() => {
    await expect(nativeAdapter.read(new Uint8Array([1, 2, 3]).buffer, undefined, new DroppedFeatures()))
      .rejects.toThrow(/could not be parsed/);
  });

  it('should read the unstyled fixtures exactly as the ExcelJS adapter does', async() => {
    for (const name of ['values', 'layout', 'sparse', 'wide-columns', 'multi-sheet', 'formulas']) {
      const native = await nativeAdapter.read(load(name), undefined, new DroppedFeatures());
      const viaExcelJs = await excelJsAdapter.read(load(name), ExcelJS, new DroppedFeatures());

      // Three legitimate differences are normalized away. Conditional-formatting rules differ in
      // object shape (ExcelJS adds its own bookkeeping keys), so they are compared by ref only. The
      // ExcelJS adapter reads a time as a Date and turns it back into a serial, which loses a few
      // ulps (0.5208333333333334 comes back as 0.52083333333212), so numbers are rounded to nine
      // decimals on both sides – `exceljsRead.unit.js` uses `toBeCloseTo` on that same cell. And a
      // cell whose only xf difference from the base is its number format (e.g. `values.xlsx`'s
      // "Amount"/"Hired"/"Start"/"Ratio" columns) still references the SAME font/fill ids as the
      // base xf (verified against the fixture's own `xl/styles.xml`) – no style is actually applied.
      // ExcelJS's `cell.font`/`cell.fill` getters resolve those shared ids into a full object anyway
      // (`{color:{theme:1},family:2,name:'Calibri',scheme:'minor',size:11}` / `{pattern:'none',…}`)
      // purely because the cell carries an `s` attribute at all, while `cell.border`/`cell.alignment`
      // correctly resolve to `{}`/`undefined` in the same case. That is a quirk of ExcelJS's own
      // object model, not a difference in what the file means, and the native reader's `style: null`
      // for exactly this shape is already pinned by `nativeStyles.unit.js`. So a font/fill is kept
      // only when it carries a property the model actually tracks (bold, italic, underline, an argb
      // color, or a solid fill's foreground color); otherwise it collapses to `null` on both sides.
      const round = value => (typeof value === 'number' ? Math.round(value * 1e9) / 1e9 : value);
      const normalizeFont = (font) => {
        if (!font) {
          return null;
        }

        const { bold, italic, underline, color } = font;
        const argb = color && typeof color.argb === 'string' ? color : undefined;

        return bold || italic || underline || argb ? { bold, italic, underline, color: argb } : null;
      };
      const normalizeFill = fill => (fill && fill.pattern === 'solid' && fill.fgColor ? fill : null);
      const normalizeStyle = (style) => {
        if (!style) {
          return null;
        }

        const font = normalizeFont(style.font);
        const fill = normalizeFill(style.fill);
        const alignment = style.alignment ?? null;
        const border = style.border ?? null;

        return font || fill || alignment || border ? { alignment, font, fill, border } : null;
      };
      const normalize = (key, value) => (key === 'style' ? normalizeStyle(value) : round(value));
      const strip = snapshot => JSON.parse(JSON.stringify(snapshot.sheets.map(sheet => ({
        ...sheet, conditionalFormatting: sheet.conditionalFormatting.map(cf => cf.ref),
      })), normalize));

      expect(strip(native)).toEqual(strip(viaExcelJs));
    }
  });
});
