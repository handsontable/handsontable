/**
 * @jest-environment node
 */
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { MAX_INPUT_BYTES } from '../limits';
import { SheetBuilder } from '../builder';
import { createWorkbookSnapshot } from '../model';
import { readZip } from '../adapters/native/zip/reader';
import { writeZip } from '../adapters/native/zip/writer';
import { loadFixture as load, toArrayBuffer } from './helpers/fixtures';
import { strip } from './helpers/snapshotNormalize';

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

    await expect(nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures()))
      .rejects.toThrow(/sheet "Huge" declares 1048577 rows, above the 1048576-row limit/);
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

      // Three legitimate differences are normalized away, and exactly three: the reason for each
      // one, and the rule that no fourth may ever be added, live at the top of
      // `helpers/snapshotNormalize.js`, which `enginesParity.unit.js` imports from too.
      expect(strip(native)).toEqual(strip(viaExcelJs));
    }
  });
});

describe('nativeAdapter.read: merge members with no <c> element of their own', () => {
  it('should materialize a merge member the writer never emitted, so the row reaches full width', async() => {
    // Exactly the shape the native writer produces for `A1:B1` merged with only A1 carrying a
    // value: `writeCell`'s `isCovered` branch emits no `<c r="B1">` at all because B1 has no style,
    // so the only evidence B1 exists is `<mergeCells>` and `<dimension>`. Before the merge pass
    // materialized its members, the reader derived the width from the `<c>` elements alone and
    // handed back a one-cell row — `importFile`'s mapper takes the sheet width from the widest row,
    // so the merge then fell outside the used range and was dropped entirely.
    const snapshot = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Sheet1');

    sheet.cell(1, 1).value = 'master';
    sheet.merge(1, 1, 1, 2);
    snapshot.sheets.push(sheet.toSnapshot());

    const bytes = await nativeAdapter.write(snapshot, undefined, new DroppedFeatures());
    const roundTripped = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());
    const row = roundTripped.sheets[0].rows[0];

    expect(row).toHaveLength(2);
    expect(row[0].value).toBe('master');
    expect(row[1]).toBeNull();
    expect(roundTripped.sheets[0].merges).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);

    // The same file read by ExcelJS, the behavior this reader was brought in line with.
    const viaExcelJs = await excelJsAdapter.read(toArrayBuffer(bytes), ExcelJS, new DroppedFeatures());

    expect(viaExcelJs.sheets[0].rows[0]).toHaveLength(2);
    expect(viaExcelJs.sheets[0].rows[0][1]).toBeNull();
  });
});

/**
 * Rewrites one XML part so that every element of its DEFAULT namespace carries an `x:` prefix,
 * and the default namespace declaration becomes a declaration of that prefix. Attributes are left
 * exactly as written, and an element that already carries a prefix (`vt:lpstr`, `x14ac:…`) is
 * skipped — the name pattern stops at the colon, so the lookahead never matches.
 *
 * @param {string} xml The part text.
 * @returns {string}
 */
function prefixElements(xml) {
  return xml
    .replace(/xmlns="/g, 'xmlns:x="')
    .replace(/<(\/?)([A-Za-z_][\w.-]*)(?=[\s/>])/g, (match, slash, name) => `<${slash}x:${name}`);
}

/**
 * Repacks a fixture, passing every part's text through `transform`.
 *
 * @param {string} name The fixture name.
 * @param {Function} transform Receives the part name and its text, returns the text to write.
 * @returns {Promise<ArrayBuffer>}
 */
async function repack(name, transform) {
  const zip = await readZip(load(name));
  const encoder = new TextEncoder();
  const entries = [];

  for (const partName of zip.names()) {
    // eslint-disable-next-line no-await-in-loop
    const text = await zip.text(partName);

    entries.push({ name: partName, data: encoder.encode(transform(partName, text)) });
  }

  return toArrayBuffer(await writeZip(entries, true));
}

/**
 * Repacks a fixture with every XML part's elements namespace-prefixed.
 *
 * @param {string} name The fixture name.
 * @returns {Promise<ArrayBuffer>}
 */
function loadPrefixed(name) {
  return repack(name, (partName, text) => prefixElements(text));
}

describe('nativeAdapter.read with namespace-prefixed parts', () => {
  it('should read a workbook whose main-namespace elements all carry a prefix exactly as the unprefixed one', async() => {
    // Excel and Google Sheets bind the main namespace as the default one, but nothing in the
    // schema requires that — a generator may write `<x:worksheet xmlns:x="…"><x:c>`. The readers
    // used to switch on the raw element name, so such a file read back as an empty sheet with no
    // styles and no shared strings, silently.
    for (const name of ['values', 'styles']) {
      const plainDropped = new DroppedFeatures();
      const prefixedDropped = new DroppedFeatures();
      // eslint-disable-next-line no-await-in-loop
      const plain = await nativeAdapter.read(load(name), undefined, plainDropped);
      // eslint-disable-next-line no-await-in-loop
      const prefixed = await nativeAdapter.read(await loadPrefixed(name), undefined, prefixedDropped);

      expect(prefixed).toEqual(plain);
      expect(prefixedDropped.list()).toEqual(plainDropped.list());
    }
  });

  it('should not read an x14:-prefixed conditionalFormatting inside <extLst> as a second block', async() => {
    // The other half of the rule, and the half the test above cannot reach. `createLocalName`
    // strips ONLY the prefix the part's ROOT element carries, so a `<extLst>` extension in the x14
    // namespace keeps its prefix and matches nothing. A normalizer that stripped EVERY prefix
    // instead read that extension as a second, empty (`ref: ''`) conditional-formatting block —
    // the exact mutant `enginesParity.unit.js` kills on ExcelJS-written bytes. It is killed here
    // too, so the file that documents the rule proves both halves of it rather than one.
    const x14Block = '<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" '
      + 'xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main">'
      + '<x14:conditionalFormattings><x14:conditionalFormatting>'
      + '<x14:cfRule type="dataBar" id="{0A1B2C3D-0000-0000-0000-000000000000}"/>'
      + '<xm:sqref xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main">A1:A3</xm:sqref>'
      + '</x14:conditionalFormatting></x14:conditionalFormattings></ext></extLst>';
    const plain = await nativeAdapter.read(load('formulas'), undefined, new DroppedFeatures());
    const withExtension = await nativeAdapter.read(await repack('formulas', (partName, text) => (
      partName === 'xl/worksheets/sheet1.xml' ? text.replace('</worksheet>', `${x14Block}</worksheet>`) : text
    )), undefined, new DroppedFeatures());

    expect(plain.sheets[0].conditionalFormatting).toHaveLength(1);
    expect(withExtension.sheets[0].conditionalFormatting).toHaveLength(1);
    expect(withExtension.sheets[0].conditionalFormatting).toEqual(plain.sheets[0].conditionalFormatting);
  });
});
