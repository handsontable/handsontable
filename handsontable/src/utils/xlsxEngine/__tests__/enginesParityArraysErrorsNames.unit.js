/**
 * @jest-environment node
 *
 * Four-way parity (native/ExcelJS writer x native/ExcelJS reader) for dynamic-array formulas, plain
 * error cells and defined names (DEV-3648). Each leg states the documented divergences explicitly.
 */
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';
import { toArrayBuffer } from './helpers/fixtures';
import { strip } from './helpers/snapshotNormalize';
import { readZip } from '../adapters/native/zip/reader';
import { writeZip } from '../adapters/native/zip/writer';

function buildSnapshot() {
  const snapshot = createWorkbookSnapshot();
  const sheet = new SheetBuilder('Sheet1');

  sheet.cell(1, 1).value = 1;
  sheet.cell(2, 1).value = 2;
  sheet.cell(3, 1).value = 3;
  sheet.cell(1, 4).formula = { text: 'SEQUENCE(3)', result: 1, array: { ref: 'D1:D3', dynamic: true } };
  sheet.cell(2, 4).value = 2;
  sheet.cell(3, 4).value = 3;
  sheet.cell(1, 5).formula = { text: 'A1:A2*2', result: 2, array: { ref: 'E1:E2', dynamic: false } };
  sheet.cell(2, 5).value = 4;
  Object.assign(sheet.cell(1, 6), { value: '#N/A', valueIsError: true });
  sheet.cell(1, 7).formula = { text: '1/0', result: '#DIV/0!', resultIsError: true };
  sheet.cell(1, 8).formula = { text: '"#N/A"', result: '#N/A' };
  snapshot.sheets.push(sheet.toSnapshot());
  snapshot.definedNames = [
    { name: 'Sales', formula: 'Sheet1!$A$1:$A$3', sheetName: null },
    { name: 'TaxRate', formula: '0.07', sheetName: null },
  ];

  return snapshot;
}

async function legs() {
  const nativeDropped = new DroppedFeatures();
  const exceljsDropped = new DroppedFeatures();
  const nativeBytes = toArrayBuffer(await nativeAdapter.write(buildSnapshot(), undefined, nativeDropped));
  const exceljsBytes = toArrayBuffer(await excelJsAdapter.write(buildSnapshot(), ExcelJS, exceljsDropped));
  const readN = bytes => nativeAdapter.read(bytes, undefined, new DroppedFeatures());
  const readE = bytes => excelJsAdapter.read(bytes, ExcelJS, new DroppedFeatures());

  return {
    nativeDropped,
    exceljsDropped,
    nativeBytes,
    nn: await readN(nativeBytes),
    ne: await readE(nativeBytes),
    en: await readN(exceljsBytes),
    ee: await readE(exceljsBytes),
  };
}

/**
 * Sets the dynamic flag of the D1 master in a stripped sheet list, to compare modulo the known divergence.
 *
 * @param {Array} stripped The stripped sheets.
 * @param {boolean} dynamic The flag to set.
 * @returns {Array}
 */
function withDynamic(stripped, dynamic) {
  const copy = JSON.parse(JSON.stringify(stripped));
  const cell = copy[0].rows[0][3];

  cell.formula.array.dynamic = dynamic;

  return copy;
}

describe('four-way parity: arrays, errors, defined names', () => {
  let result;

  beforeAll(async() => {
    result = await legs();
  });

  it('native write -> native read keeps every feature', () => {
    const [row] = result.nn.sheets[0].rows;

    expect(row[3].formula.array).toEqual({ ref: 'D1:D3', dynamic: true });
    expect(row[4].formula.array).toEqual({ ref: 'E1:E2', dynamic: false });
    expect(row[5]).toEqual(expect.objectContaining({ value: '#N/A', valueIsError: true }));
    expect(row[6].formula).toEqual(expect.objectContaining({ result: '#DIV/0!', resultIsError: true }));
    expect(row[7].formula.resultIsError).toBeFalsy();
    expect(row[7].formula.result).toBe('#N/A');
    expect(result.nn.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$A$1:$A$3', sheetName: null },
      { name: 'TaxRate', formula: '0.07', sheetName: null },
    ]);
    expect(result.nativeDropped.list()).not.toContain('dynamicArrays');
  });

  it('native write -> ExcelJS read differs only by dynamic:false and the dropped TaxRate constant', () => {
    const [row] = result.ne.sheets[0].rows;

    expect(row[3].formula.array).toEqual({ ref: 'D1:D3', dynamic: false });
    expect(strip(result.ne)).toEqual(withDynamic(strip(result.nn), false));
    expect(result.ne.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$A$1:$A$3', sheetName: null },
    ]);
  });

  it('ExcelJS write -> native read downgrades dynamic to CSE and drops TaxRate', () => {
    const [row] = result.en.sheets[0].rows;

    expect(row[3].formula.array).toEqual({ ref: 'D1:D3', dynamic: false });
    expect(strip(result.en)).toEqual(withDynamic(strip(result.nn), false));
    expect(result.exceljsDropped.list()).toContain('dynamicArrays');
    expect(result.exceljsDropped.list()).toContain('definedNames:unsupported');
    expect(result.en.definedNames.map(({ name }) => name)).toEqual(['Sales']);
  });

  it('ExcelJS write -> ExcelJS read agrees with the ExcelJS write -> native read leg', () => {
    expect(strip(result.ee)).toEqual(strip(result.en));
    expect(result.ee.definedNames).toEqual(result.en.definedNames);
    expect(result.ee.sheets[0].rows[0][7].formula.resultIsError).toBeFalsy();
    expect(result.ee.sheets[0].rows[0][7].formula.result).toBe('#N/A');
  });

  describe('Excel dialect (cm="1" + metadata part)', () => {
    it('reads a native-written dynamic master with cm="1" on the native reader, and as CSE on ExcelJS', async() => {
      const zip = await readZip(result.nativeBytes);

      expect(zip.names()).toContain('xl/metadata.xml');
      expect(await zip.text('xl/worksheets/sheet1.xml')).toMatch(/<c r="D1"[^>]* cm="1"/);
      expect(result.nn.sheets[0].rows[0][3].formula.array.dynamic).toBe(true);
      expect(result.ne.sheets[0].rows[0][3].formula.array.dynamic).toBe(false);
    });

    it('reads a rewritten file with cm="1", metadata, override and relationship the same on both readers except dynamic', async() => {
      // Start from the ExcelJS-written file (no metadata), and add the Excel dynamic-array machinery.
      const exceljsBytes = toArrayBuffer(
        await excelJsAdapter.write(buildSnapshot(), ExcelJS, new DroppedFeatures())
      );
      const metadata = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<metadata xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
        + ' xmlns:xda="http://schemas.microsoft.com/office/spreadsheetml/2017/dynamicarray">'
        + '<metadataTypes count="1"><metadataType name="XLDAPR" minSupportedVersion="120000" copy="1"'
        + ' pasteAll="1" pasteValues="1" merge="1" splitFirst="1" rowColShift="1" clearFormats="1"'
        + ' clearComments="1" assign="1" coerce="1" cellMeta="1"/></metadataTypes>'
        + '<futureMetadata name="XLDAPR" count="1"><bk><extLst><ext uri="{bdbb8cdc-fa1e-496e-a857-3c3f30c029c3}">'
        + '<xda:dynamicArrayProperties fDynamic="1" fCollapsed="0"/></ext></extLst></bk></futureMetadata>'
        + '<cellMetadata count="1"><bk><rc t="1" v="0"/></bk></cellMetadata></metadata>';
      const encoder = new TextEncoder();
      const zip = await readZip(exceljsBytes);
      const names = zip.names();
      const entries = [];

      for (const name of names) {
        let text = await zip.text(name);

        if (name === 'xl/worksheets/sheet1.xml') {
          text = text.replace('<c r="D1"', '<c r="D1" cm="1"');
        } else if (name === '[Content_Types].xml') {
          text = text.replace('</Types>', '<Override PartName="/xl/metadata.xml"'
            + ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml"/></Types>');
        } else if (name === 'xl/_rels/workbook.xml.rels') {
          text = text.replace('</Relationships>', '<Relationship Id="rIdMeta"'
            + ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata"'
            + ' Target="metadata.xml"/></Relationships>');
        }
        entries.push({ name, data: encoder.encode(text) });
      }
      entries.push({ name: 'xl/metadata.xml', data: encoder.encode(metadata) });

      const dialect = toArrayBuffer(await writeZip(entries, true));
      const native = await nativeAdapter.read(dialect, undefined, new DroppedFeatures());
      const exceljs = await excelJsAdapter.read(dialect, ExcelJS, new DroppedFeatures());

      expect(native.sheets[0].rows[0][3].formula.array).toEqual({ ref: 'D1:D3', dynamic: true });
      expect(exceljs.sheets[0].rows[0][3].formula.array).toEqual({ ref: 'D1:D3', dynamic: false });
      expect(strip(exceljs)).toEqual(withDynamic(strip(native), false));
    });
  });
});
