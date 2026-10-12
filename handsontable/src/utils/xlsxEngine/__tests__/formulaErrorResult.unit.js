/**
 * @jest-environment node
 */
import ExcelJS from 'exceljs';
import { excelJsAdapter } from '../adapters/exceljs';
import { nativeAdapter } from '../adapters/native';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';
import { readZip } from '../adapters/native/zip/reader';
import { toArrayBuffer } from './helpers/fixtures';

/**
 * The four cells of the QA report: three formulas whose cached result is a real error, and one
 * whose result is the TEXT `#N/A`, which must stay a string.
 *
 * @returns {object}
 */
function errorResultSnapshot() {
  const snapshot = createWorkbookSnapshot();
  const builder = new SheetBuilder('Sheet1');

  builder.cell(1, 1).formula = { text: '1/0', result: '#DIV/0!', resultIsError: true };
  builder.cell(1, 2).formula = { text: 'NA()', result: '#N/A', resultIsError: true };
  builder.cell(1, 3).formula = { text: 'SQRT(-1)', result: '#NUM!', resultIsError: true };
  builder.cell(1, 4).formula = { text: '"#N/A"', result: '#N/A' };
  snapshot.sheets.push(builder.toSnapshot());

  return snapshot;
}

/**
 * The `t` attribute of one `<c>` in the first sheet's XML, or `undefined` when it has none.
 *
 * @param {string} xml The sheet XML.
 * @param {string} ref The A1 address.
 * @returns {string|undefined}
 */
function cellType(xml, ref) {
  const match = xml.match(new RegExp(`<c r="${ref}"[^>]*>`));

  if (!match) {
    throw new Error(`No <c r="${ref}"> in the sheet XML.`);
  }

  return match[0].match(/ t="([^"]*)"/)?.[1];
}

/**
 * The `<v>` text of one `<c>` in the first sheet's XML.
 *
 * @param {string} xml The sheet XML.
 * @param {string} ref The A1 address.
 * @returns {string|undefined}
 */
function cellCachedText(xml, ref) {
  return xml.match(new RegExp(`<c r="${ref}"[^>]*>.*?<v>([^<]*)</v>`))?.[1];
}

describe.each([
  ['native', nativeAdapter, undefined],
  ['ExcelJS', excelJsAdapter, ExcelJS],
])('%s writer: a formula whose cached result is an error', (_label, adapter, module) => {
  async function writeSheetXml(snapshot) {
    const bytes = await adapter.write(snapshot, module, new DroppedFeatures());

    const xml = await (await readZip(toArrayBuffer(bytes))).text('xl/worksheets/sheet1.xml');

    return { bytes, xml };
  }

  it('should type `=1/0`, `=NA()` and `=SQRT(-1)` as `t="e"` and keep the text `="#N/A"` as `t="str"`', async() => {
    const { xml } = await writeSheetXml(errorResultSnapshot());

    expect(cellType(xml, 'A1')).toBe('e');
    expect(cellCachedText(xml, 'A1')).toBe('#DIV/0!');
    expect(cellType(xml, 'B1')).toBe('e');
    expect(cellCachedText(xml, 'B1')).toBe('#N/A');
    expect(cellType(xml, 'C1')).toBe('e');
    expect(cellCachedText(xml, 'C1')).toBe('#NUM!');
    expect(cellType(xml, 'D1')).toBe('str');
    expect(cellCachedText(xml, 'D1')).toBe('#N/A');
  });

  it('should keep a flagged result that is not an OOXML error code a `t="str"` text', async() => {
    // `t="e"` holding anything but one of the seven error codes is a file Excel repairs, so a
    // HyperFormula-only error (`#CYCLE!`, `#ERROR!`, `#LIC!`) or a hand-built snapshot is written as
    // its text, which is what every engine wrote before.
    const snapshot = createWorkbookSnapshot();
    const builder = new SheetBuilder('Sheet1');

    builder.cell(1, 1).formula = { text: 'A1', result: '#CYCLE!', resultIsError: true };
    builder.cell(1, 2).formula = { text: '1/0', result: 0, resultIsError: true };
    snapshot.sheets.push(builder.toSnapshot());

    const { xml } = await writeSheetXml(snapshot);

    expect(cellType(xml, 'A1')).toBe('str');
    expect(cellCachedText(xml, 'A1')).toBe('#CYCLE!');
    expect(cellType(xml, 'B1')).toBeUndefined();
    expect(cellCachedText(xml, 'B1')).toBe('0');
  });

  it.each([
    ['native', nativeAdapter, undefined],
    ['ExcelJS', excelJsAdapter, ExcelJS],
  ])('should read the error results back through the %s reader as the code text', async(_r, reader, readerModule) => {
    const { bytes } = await writeSheetXml(errorResultSnapshot());
    const read = await reader.read(toArrayBuffer(bytes), readerModule, new DroppedFeatures());
    const row = read.sheets[0].rows[0];

    expect(row.map(cell => cell.formula?.result)).toEqual(['#DIV/0!', '#N/A', '#NUM!', '#N/A']);
  });
});
