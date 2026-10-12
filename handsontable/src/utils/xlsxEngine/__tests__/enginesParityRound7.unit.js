/**
 * @jest-environment node
 *
 * Parity cases from the #13634 review round 7: what the two readers hand over for the same bytes,
 * and what the import infers from it.
 */
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { inferCellType } from '../../../plugins/importFile/inference';
import { toArrayBuffer } from './helpers/fixtures';

/**
 * Writes a workbook with ExcelJS directly, bypassing both adapters' writers.
 *
 * @param {Function} buildFn Fills the workbook.
 * @returns {Promise<ArrayBuffer>}
 */
async function writeDirectly(buildFn) {
  const workbook = new ExcelJS.Workbook();

  buildFn(workbook);

  return toArrayBuffer(new Uint8Array(await workbook.xlsx.writeBuffer()));
}

/**
 * Reads the bytes with both readers.
 *
 * @param {ArrayBuffer} bytes The workbook.
 * @returns {Promise<object>}
 */
async function readBoth(bytes) {
  const nativeDropped = new DroppedFeatures();
  const exceljsDropped = new DroppedFeatures();

  return {
    native: (await nativeAdapter.read(bytes, undefined, nativeDropped)).sheets[0],
    exceljs: (await excelJsAdapter.read(bytes, ExcelJS, exceljsDropped)).sheets[0],
    nativeDropped,
    exceljsDropped,
  };
}

describe('engines parity (review round 7)', () => {
  it('does not shift the cached result of an elapsed-time formula in a 1904 workbook on either reader', async() => {
    // The ExcelJS adapter takes the 1904 shift off a time formula's cached result separately from a
    // plain value. With that branch gone, the ExcelJS engine returned 1462.5 here.
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      workbook.properties.date1904 = true;
      sheet.addRow([0.5, 25.5 / 24, 2, 0.75, 43844]);
      ['A1', 'B1', 'C1'].forEach((address) => {
        sheet.getCell(address).numFmt = '[h]:mm';
      });
      sheet.getCell('D1').numFmt = 'h:mm';
      sheet.getCell('E1').numFmt = 'yyyy-mm-dd';
      sheet.getCell('F1').value = { formula: 'A1*1', result: 0.5 };
      sheet.getCell('F1').numFmt = '[h]:mm';
      sheet.getCell('G1').value = { formula: 'A1+B1', result: 1.0625 };
      sheet.getCell('G1').numFmt = 'h:mm';
    });
    const { native, exceljs } = await readBoth(bytes);
    const expected = [0.5, 1.0625, 2, 0.75, 45306, null, null];

    expect(native.rows[0].map(cell => cell.value)).toEqual(expected);
    expect(exceljs.rows[0].map(cell => cell.value)).toEqual(expected);
    expect(native.rows[0][5].formula.result).toBe(0.5);
    expect(exceljs.rows[0][5].formula.result).toBe(0.5);
    expect(native.rows[0][6].formula.result).toBe(1.0625);
    expect(exceljs.rows[0][6].formula.result).toBe(1.0625);
  });

  it('reports a number ExcelJS turned into an invalid date instead of importing a silent empty cell', async() => {
    // ExcelJS unescapes LibreOffice's `\M` (millions) into a month and hands a `Date` over; past
    // serial 100 025 569 that `Date` is invalid and the number is gone before the adapter sees it.
    const numFmt = '[>=1000000]0.0,,\\M;[>=1000]0.0,\\K;0';
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      sheet.addRow([1234567, 2125551234, 5e12]);
      ['A1', 'B1', 'C1'].forEach((address) => {
        sheet.getCell(address).numFmt = numFmt;
      });
    });
    const { native, exceljs, nativeDropped, exceljsDropped } = await readBoth(bytes);

    expect(native.rows[0].map(cell => cell.value)).toEqual([1234567, 2125551234, 5e12]);
    expect(nativeDropped.list()).toEqual([]);
    expect(exceljs.rows[0][0].value).toBe(1234567);
    expect(exceljs.rows[0][1].value).toBeNull();
    expect(exceljs.rows[0][2].value).toBeNull();
    expect(exceljsDropped.list()).toEqual([`numFmt:${exceljs.rows[0][1].numFmt}`]);
    expect(exceljsDropped.count(`numFmt:${exceljs.rows[0][1].numFmt}`)).toBe(2);
  });

  it('infers the day of the month for an escaped long date on both readers', async() => {
    // The built-in reader keeps the backslashes and ExcelJS's does not; deleting the escapes fused
    // `dddd\,\ d` into one weekday run on the built-in engine only.
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      sheet.addRow([43486]);
      sheet.getCell('A1').numFmt = 'dddd\\,\\ d\\ mmmm\\ yyyy';
    });
    const { native, exceljs } = await readBoth(bytes);
    const expected = { type: 'date', dateFormat: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } };

    expect(inferCellType(native.rows[0][0])).toEqual(expected);
    expect(inferCellType(exceljs.rows[0][0])).toEqual(expected);
  });

  it('reads a dollar locale token as its own currency on both readers', async() => {
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      sheet.addRow([1234.5, 1234.5, 1234.5]);
      sheet.getCell('A1').numFmt = '[$$-C09]#,##0.00';
      sheet.getCell('B1').numFmt = '#,##0.00[$$-1009]';
      sheet.getCell('C1').numFmt = '$#,##0.00';
    });
    const { native, exceljs } = await readBoth(bytes);

    [native, exceljs].forEach((sheet) => {
      expect(sheet.rows[0].map(cell => inferCellType(cell).numericFormat.currency)).toEqual(['AUD', 'CAD', 'USD']);
    });
  });

  it('reads a unit label that is no ISO code as a plain number on both readers', async() => {
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      sheet.addRow([12.5, 12.5]);
      sheet.getCell('A1').numFmt = '0.0" DAY"';
      sheet.getCell('B1').numFmt = '#,##0" PCS"';
    });
    const { native, exceljs } = await readBoth(bytes);

    [native, exceljs].forEach((sheet) => {
      sheet.rows[0].forEach((cell) => {
        expect(inferCellType(cell).numericFormat.style).toBeUndefined();
      });
    });
  });
});
