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
import { MAX_INFLATED_TOTAL_BYTES } from '../limits';
import { mapWorkbook, resolveImportOptions } from '../../../plugins/importFile/mapper';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../xlsxEntitlement';
import { readZip } from '../adapters/native/zip/reader';
import { writeZip } from '../adapters/native/zip/writer';
import { loadFixture, rewriteArchive, toArrayBuffer } from './helpers/fixtures';

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

  it('should import a rich error the engine does not know as #VALUE!, leaving the classic codes alone', async() => {
    // C1 and E1 lose their formulas, so both import their codes as values; E1 becomes `#DIV/0!`.
    const bytes = await rewritten({
      [SHEET_PART]: text => text.replace(/<f t="array"[^>]*>[^<]*<\/f>/g, ''),
      [VALUES_PART]: text => text.replace('<v>0</v><v>8</v>', '<v>0</v><v>13</v>')
        .replace('<rv s="1"><v>13</v>', '<rv s="1"><v>1</v>'),
    });
    const map = (context) => {
      const dropped = new DroppedFeatures();

      return nativeAdapter.read(bytes, undefined, dropped).then(workbook => mapWorkbook(workbook,
        resolveImportOptions({}), {
          formulasEnabled: true,
          commentsEnabled: false,
          customBordersEnabled: false,
          entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
          ...context,
        }, dropped));
    };

    // An engine that knows neither code: `#CALC!` goes back to the `#VALUE!` Excel caches for it;
    // `#DIV/0!` is a code the file caches as it is, so it is not the reader's to change.
    expect((await map({ recognizesErrorCode: () => false })).data[0]).toEqual([1, null, '#VALUE!', null, '#DIV/0!']);
    expect((await map({ recognizesErrorCode: code => code === '#CALC!' })).data[0])
      .toEqual([1, null, '#CALC!', null, '#DIV/0!']);
    // An engine that cannot answer trusts every code.
    expect((await map({})).data[0]).toEqual([1, null, '#CALC!', null, '#DIV/0!']);
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

  it('should keep the cached value of an error type the reader does not know, reporting it', async() => {
    const bytes = await rewritten({
      [VALUES_PART]: text => text.replace('<rv s="1"><v>13</v>', '<rv s="1"><v>99</v>'),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].formula.result).toBe('#SPILL!');
    expect(rows[0][4].formula.result).toBe('#VALUE!');
    expect(dropped).toContain('cellValue:richValue');
    expect(dropped).not.toContain('images');
  });

  it('should read the classic error codes a writer stores as rich values, and leave #BUSY! out', async() => {
    // `ERROR.TYPE` minus one: 1 is `#DIV/0!`. 14 is what one source gives `#BUSY!`, which
    // `ERROR.TYPE` has no number for, so it keeps the cached value.
    const bytes = await rewritten({
      [VALUES_PART]: text => text.replace('<v>0</v><v>8</v>', '<v>0</v><v>14</v>')
        .replace('<rv s="1"><v>13</v>', '<rv s="1"><v>1</v>'),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].formula.result).toBe('#VALUE!');
    expect(rows[0][4].formula.result).toBe('#DIV/0!');
    expect(dropped).toContain('cellValue:richValue');
  });

  it('should report a linked data type with no formula, keeping the cached value', async() => {
    // A Stocks or Geography cell: no formula, a rich value that is neither an error nor a picture.
    // The unresolved guess used to take it for a picture; resolved, it recorded nothing at all.
    const bytes = await rewritten({
      [SHEET_PART]: text => text.replace(/<f t="array" aca="1" ref="C1" ca="1">[^<]*<\/f>/, ''),
      [STRUCTURES_PART]: text => text
        .replace('<s t="_error"><k n="colOffset"', '<s t="_linkedEntity"><k n="colOffset"'),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].value).toBe('#VALUE!');
    expect(dropped).toContain('cellValue:richValue');
    expect(dropped).not.toContain('images');
  });

  it('should read an index written with a leading `+` the way the sheet reads `vm`', async() => {
    const bytes = await rewritten({
      'xl/metadata.xml': text => text.replace('<xlrd:rvb i="1"/>', '<xlrd:rvb i="+1"/>')
        .replace('<rc t="2" v="1"/>', '<rc t="+2" v="01"/>'),
      [SHEET_PART]: text => text.replace('vm="2"', 'vm="+2"'),
    });
    const { rows } = await read(bytes);

    expect(rows[0][4].formula.result).toBe('#CALC!');
  });

  it('should judge the cells in place when the workbook has no rich-value parts', async() => {
    const bytes = await rewritten({
      'xl/_rels/workbook.xml.rels': text => withoutRelationship('rdRichValue')(
        withoutRelationship('sheetMetadata')(text)
      ),
      [SHEET_PART]: text => text.replace(/<f t="array" aca="1" ref="C1" ca="1">[^<]*<\/f>/, ''),
    });
    const { rows, dropped } = await read(bytes);

    expect(rows[0][2].value).toBe('#VALUE!');
    expect(rows[0][4].formula.result).toBe('#VALUE!');
    expect(dropped).toContain('images');
  });

  it('should read a workbook whose rich-value parts pass the inflate budget, without the error codes', async() => {
    // 130 MB of padding costs 260 MB as a string, over the 256 MB budget on its own. The parts are
    // optional, so the workbook reads with its cached values, as it did before the reader knew them.
    // The second sheet is read after the refusal: the budget gave the refused part's charge back,
    // or that read was refused over bytes no one held.
    const padding = 130 * 1024 * 1024;

    expect(padding * 2).toBeGreaterThan(MAX_INFLATED_TOTAL_BYTES);

    // The second sheet is a part of its own, so it is inflated after the refusal.
    const zip = await readZip(await rewritten({
      'xl/workbook.xml': text => text.replace('<sheet name="Data" sheetId="1" r:id="rId1"/>',
        '<sheet name="Data" sheetId="1" r:id="rId1"/><sheet name="Two" sheetId="2" r:id="rId99"/>'),
      'xl/_rels/workbook.xml.rels': text => text.replace('</Relationships>', '<Relationship Id="rId99" '
        + 'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        + 'Target="worksheets/sheet2.xml"/></Relationships>'),
      '[Content_Types].xml': text => text.replace('</Types>', '<Override PartName="/xl/worksheets/sheet2.xml" '
        + 'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    }));
    const encoder = new TextEncoder();
    const entries = [];

    for (const name of zip.names()) {
      // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
      const text = await zip.text(name);

      entries.push({
        name,
        data: encoder.encode(name === VALUES_PART
          ? text.replace('<rvData', `<!--${' '.repeat(padding)}--><rvData`)
          : text),
      });
    }

    entries.push({
      name: 'xl/worksheets/sheet2.xml',
      data: encoder.encode('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<sheetData><row r="1"><c r="A1"><v>42</v></c></row></sheetData></worksheet>'),
    });

    const dropped = new DroppedFeatures();
    const workbook = await nativeAdapter.read(toArrayBuffer(await writeZip(entries, true)), undefined, dropped);

    expect(workbook.sheets[0].rows[0][4].formula.result).toBe('#VALUE!');
    expect(workbook.sheets[1].rows[0][0].value).toBe(42);
  }, 60_000);

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

  it('should keep the place of a self-closing block, so later indexes do not shift', () => {
    // `<bk/>` fires no close event; skipping it read `vm` 2 as the block of `vm` 3.
    const metadata = '<metadata xmlns:xlrd="x">'
      + '<metadataTypes count="1"><metadataType name="XLRICHVALUE"/></metadataTypes>'
      + '<futureMetadata name="XLRICHVALUE" count="3"><bk/>'
      + '<bk><extLst><ext><xlrd:rvb i="4"/></ext></extLst></bk>'
      + '<bk><extLst><ext><xlrd:rvb i="6"/></ext></extLst></bk></futureMetadata>'
      + '<valueMetadata count="3"><bk><rc t="1" v="2"/></bk><bk/><bk><rc t="1" v="1"/></bk></valueMetadata>'
      + '</metadata>';

    expect(richValues.parseValueMetadata(metadata)).toEqual([6, -1, 4]);
  });

  it('should read no blocks from a self-closing section', () => {
    expect(richValues.parseValueMetadata('<metadata><valueMetadata/><futureMetadata name="XLRICHVALUE"/>'
      + '<metadataTypes/></metadata>')).toEqual([]);
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
