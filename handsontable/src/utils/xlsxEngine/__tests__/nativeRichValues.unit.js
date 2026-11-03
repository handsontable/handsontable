/**
 * @jest-environment node
 *
 * Error cells that carry value metadata (`<c t="e" vm>`). Excel stores the errors `#SPILL!` and
 * `#CALC!` (and the newer ones) and a picture placed in a cell as a rich value: the sheet caches
 * `#VALUE!`, and the real type is in `xl/metadata.xml` and `xl/richData`. The native reader resolves
 * it; ExcelJS cannot see `vm` and keeps `#VALUE!`.
 *
 * `excel-online-rich-errors.xlsx` was saved by Excel Online (`fixtures/README.md`): sheet `Data`,
 * A1:A3 = 1, 2, 3, C1 `=SEQUENCE(3)` blocked by the text `block` in C2 (`#SPILL!`, errorType 8,
 * `vm="1"`), E1 `=FILTER(A1:A3,A1:A3>10)` matching nothing (`#CALC!`, errorType 13, `vm="2"`).
 */
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import * as richValues from '../adapters/native/parts/richValues';
import { DroppedFeatures } from '../capabilities';
import { mapWorkbook, resolveImportOptions } from '../../../plugins/importFile/mapper';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../xlsxEntitlement';
import { loadFixture, rewriteArchive } from './helpers/fixtures';

const FIXTURE = 'excel-online-rich-errors';
const SHEET_PART = 'xl/worksheets/sheet1.xml';
const STRUCTURES_PART = 'xl/richData/rdrichvaluestructure.xml';
const VALUES_PART = 'xl/richData/rdrichvalue.xml';

/**
 * Reads a workbook with an engine.
 *
 * @param {ArrayBuffer} bytes The workbook.
 * @param {object} [adapter] The engine adapter.
 * @param {object} [engine] The engine module.
 * @returns {Promise<{ rows: Array<Array<object|null>>, dropped: string[] }>}
 */
async function read(bytes, adapter = nativeAdapter, engine = undefined) {
  const dropped = new DroppedFeatures();
  const workbook = await adapter.read(bytes, engine, dropped);

  return { workbook, rows: workbook.sheets[0].rows, dropped: dropped.list() };
}

/**
 * The fixture with some of its parts rewritten.
 *
 * @param {object} parts Part name → function from the part's text to its new text.
 * @returns {Promise<ArrayBuffer>}
 */
function rewritten(parts) {
  return rewriteArchive(loadFixture(FIXTURE), (name, text) => (parts[name] ? parts[name](text) : text));
}

/**
 * Removes the workbook relationship of a type, so the workbook does not declare that part.
 *
 * @param {string} tail The end of the relationship type.
 * @returns {Function}
 */
function withoutRelationship(tail) {
  return text => text.replace(new RegExp(`<Relationship [^>]*Type="[^"]*/${tail}"[^>]*/>`), '');
}

describe('native reader: rich value errors and pictures', () => {
  it('should read the error code of a rich value error over the cached #VALUE!', async() => {
    const { rows, dropped } = await read(loadFixture(FIXTURE));

    expect(rows[0][2].formula).toEqual({
      text: '_xlfn.SEQUENCE(3)',
      result: '#SPILL!',
      resultIsError: true,
      array: { ref: 'C1', dynamic: true },
    });
    expect(rows[0][4].formula).toEqual({
      text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>10)',
      result: '#CALC!',
      resultIsError: true,
      array: { ref: 'E1', dynamic: true },
    });
    expect(dropped).not.toContain('images');
  });

  it('should keep the cached #VALUE! through the ExcelJS engine, which cannot see `vm`', async() => {
    const { rows } = await read(loadFixture(FIXTURE), excelJsAdapter, ExcelJS);

    expect(rows[0][2].formula.result).toBe('#VALUE!');
    expect(rows[0][4].formula.result).toBe('#VALUE!');
  });

  it('should import the error codes as the cached values of the formulas', async() => {
    const dropped = new DroppedFeatures();
    const workbook = await nativeAdapter.read(loadFixture(FIXTURE), undefined, dropped);
    const result = mapWorkbook(workbook, resolveImportOptions({}), {
      formulasEnabled: false,
      commentsEnabled: false,
      customBordersEnabled: false,
      entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
    }, dropped);

    expect(result.data[0]).toEqual([1, null, '#SPILL!', null, '#CALC!']);
  });

  it('should write the error code over a plain error cell with no formula', async() => {
    const bytes = await rewritten({
      [SHEET_PART]: text => text.replace(/<f t="array" aca="1" ref="C1" ca="1">[^<]*<\/f>/, ''),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].formula).toBeNull();
    expect(rows[0][2].value).toBe('#SPILL!');
    expect(rows[0][2].valueIsError).toBe(true);
    expect(dropped).not.toContain('images');
  });

  it('should report a picture rich value as `images` and keep the cached value', async() => {
    const bytes = await rewritten({
      // The first structure (C1's) becomes a picture's.
      [STRUCTURES_PART]: text => text.replace('<s t="_error"><k n="colOffset"', '<s t="_localImage"><k n="colOffset"'),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].formula.result).toBe('#VALUE!');
    expect(rows[0][4].formula.result).toBe('#CALC!');
    expect(dropped).toContain('images');
  });

  it('should keep the cached value of an error type the reader does not know, reporting nothing', async() => {
    const bytes = await rewritten({
      [VALUES_PART]: text => text.replace('<rv s="1"><v>13</v>', '<rv s="1"><v>99</v>'),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].formula.result).toBe('#SPILL!');
    expect(rows[0][4].formula.result).toBe('#VALUE!');
    expect(dropped).not.toContain('images');
  });

  it('should keep the cached values when the workbook declares no metadata part', async() => {
    const bytes = await rewritten({ 'xl/_rels/workbook.xml.rels': withoutRelationship('sheetMetadata') });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].formula.result).toBe('#VALUE!');
    expect(rows[0][4].formula.result).toBe('#VALUE!');
    // Formula cells that do not call `IMAGE` are not taken for pictures.
    expect(dropped).not.toContain('images');
  });

  it('should take an unresolved error cell with no formula for a picture, as before', async() => {
    const bytes = await rewritten({
      'xl/_rels/workbook.xml.rels': withoutRelationship('rdRichValue'),
      [SHEET_PART]: text => text.replace(/<f t="array" aca="1" ref="C1" ca="1">[^<]*<\/f>/, ''),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].value).toBe('#VALUE!');
    expect(dropped).toContain('images');
  });

  it('should keep the cached values when a rich-value part does not parse', async() => {
    const bytes = await rewritten({ [VALUES_PART]: text => text.replace('</rvData>', '') });
    const { rows } = await read(bytes);

    expect(rows[0][2].formula.result).toBe('#VALUE!');
    expect(rows[0][4].formula.result).toBe('#VALUE!');
  });

  it('should not read the rich-value parts for a workbook whose cells carry no value metadata', async() => {
    const bytes = await rewritten({ [SHEET_PART]: text => text.replace(/ vm="\d+"/g, '') });
    const spy = jest.spyOn(richValues, 'parseRichValues');

    try {
      const { rows } = await read(bytes);

      expect(rows[0][2].formula.result).toBe('#VALUE!');
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('should read the rich-value parts once for every sheet of the workbook', async() => {
    // Two sheets over the same part, each with both error cells.
    const bytes = await rewritten({
      'xl/workbook.xml': text => text.replace('<sheet name="Data" sheetId="1" r:id="rId1"/>',
        '<sheet name="Data" sheetId="1" r:id="rId1"/><sheet name="Copy" sheetId="2" r:id="rId1"/>'),
    });
    const spy = jest.spyOn(richValues, 'parseRichValues');

    try {
      const dropped = new DroppedFeatures();
      const workbook = await nativeAdapter.read(bytes, undefined, dropped);

      expect(workbook.sheets.map(sheet => sheet.rows[0][4].formula.result)).toEqual(['#CALC!', '#CALC!']);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('rich value parts', () => {
  it('should resolve only a value metadata block of the rich value type', () => {
    const metadata = '<metadata xmlns:xlrd="x">'
      + '<metadataTypes count="2"><metadataType name="XLDAPR"/><metadataType name="XLRICHVALUE"/></metadataTypes>'
      + '<futureMetadata name="XLDAPR" count="1"><bk/></futureMetadata>'
      + '<futureMetadata name="XLRICHVALUE" count="2"><bk><extLst><ext><xlrd:rvb i="3"/></ext></extLst></bk>'
      + '<bk><extLst><ext><xlrd:rvb i="5"/></ext></extLst></bk></futureMetadata>'
      + '<valueMetadata count="3"><bk><rc t="2" v="1"/></bk><bk><rc t="1" v="0"/></bk>'
      + '<bk><rc t="2" v="7"/></bk></valueMetadata>'
      + '</metadata>';

    expect(richValues.parseValueMetadata(metadata)).toEqual([5, -1, -1]);
  });

  it('should resolve an error, a picture, an unknown error type and an unknown structure', () => {
    const structures = richValues.parseRichValueStructures('<rvStructures>'
      + '<s t="_error"><k n="errorType" t="i"/><k n="subType" t="i"/></s>'
      + '<s t="_webimage"><k n="address" t="s"/></s>'
      + '<s t="_linkedentity"><k n="name" t="s"/></s>'
      + '</rvStructures>');
    const values = richValues.parseRichValues('<rvData>'
      + '<rv s="0"><v>13</v><v>1</v></rv><rv s="1"><v>https://example.com/a.png</v></rv>'
      + '<rv s="0"><v>99</v><v>0</v></rv><rv s="2"><v>Stock</v></rv>'
      + '</rvData>');
    const lookup = richValues.createRichValueLookup([0, 1, 2, 3, 9], structures, values);

    expect(lookup.resolve(1)).toEqual({ kind: 'error', code: '#CALC!' });
    expect(lookup.resolve(2)).toEqual({ kind: 'picture' });
    expect(lookup.resolve(3)).toEqual({ kind: 'other' });
    expect(lookup.resolve(4)).toEqual({ kind: 'other' });
    expect(lookup.resolve(5)).toBeNull();
    expect(lookup.resolve(6)).toBeNull();
  });
});
