/**
 * @jest-environment node
 */
import ExcelJS from 'exceljs';
import Encryptor from 'exceljs/lib/utils/encryptor';
import { nativeAdapter } from '../adapters/native';
import { readZip } from '../adapters/native/zip/reader';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';
import { toArrayBuffer } from './helpers/fixtures';

async function writeAndLoad(snapshot) {
  const dropped = new DroppedFeatures();
  const bytes = await nativeAdapter.write(snapshot, undefined, dropped);
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(bytes);

  return { workbook, dropped, bytes };
}

function snapshotWith(buildFn, name = 'Sheet1') {
  const snapshot = createWorkbookSnapshot();
  const builder = new SheetBuilder(name);

  buildFn(builder);
  snapshot.sheets.push(builder.toSnapshot());

  return snapshot;
}

/**
 * ExcelJS returns a plain note as a string and a formatted one as `{ texts }`; normalize both.
 *
 * This has a twin in `src/plugins/exportFile/__tests__/types/xlsx/features.spec.js`. The two are
 * deliberately not shared: that suite is the frozen Jasmine/Puppeteer one, it runs in a browser
 * against the built bundle, and it cannot import a Jest helper from `src/`.
 * @param note
 */
function noteText(note) {
  return typeof note === 'string' ? note : note.texts.map(t => t.text).join('');
}

describe('nativeAdapter.write', () => {
  it('should write primitive values, number formats and formulas ExcelJS reads back', async() => {
    const { workbook, dropped } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 'text';
      b.cell(1, 2).value = 42;
      b.cell(1, 3).value = true;
      b.cell(1, 4).value = 45292;
      b.cell(1, 4).numFmt = 'mm-dd-yy';
      b.cell(2, 1).formula = { text: 'SUM(B1:B1)' };
      b.cell(2, 2).formula = { text: 'B1*2', result: 84 };
    }));
    const ws = workbook.worksheets[0];

    expect(ws.getCell('A1').value).toBe('text');
    expect(ws.getCell('B1').value).toBe(42);
    expect(ws.getCell('C1').value).toBe(true);
    expect(ws.getCell('D1').numFmt).toBe('mm-dd-yy');
    expect(ws.getCell('D1').value).toEqual(new Date(Date.UTC(2024, 0, 1)));
    expect(ws.getCell('A2').value.formula).toBe('SUM(B1:B1)');
    expect(ws.getCell('B2').value).toEqual({ formula: 'B1*2', result: 84 });
    expect(dropped.list()).toEqual([]);
  });

  it('should write styles, validation, comments and per-cell protection', async() => {
    const { workbook } = await writeAndLoad(snapshotWith((b) => {
      const cell = b.cell(1, 1);

      cell.value = 'styled';
      cell.style = {
        alignment: { horizontal: 'center', vertical: 'middle' },
        font: { bold: true, italic: true, underline: true, color: { argb: 'FFFF0000' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
        border: { top: { style: 'thin', color: { argb: 'FF0000FF' } }, left: { style: 'medium' } },
      };
      cell.validation = { type: 'list', formulae: ['"a,b,c"'], allowBlank: true };
      cell.comment = 'note';
      cell.locked = false;
      b.protect('', { sort: true });
    }));
    const cell = workbook.worksheets[0].getCell('A1');

    expect(cell.alignment).toEqual(expect.objectContaining({ horizontal: 'center', vertical: 'middle' }));
    expect(cell.font).toEqual(expect.objectContaining({ bold: true, italic: true, color: { argb: 'FFFF0000' } }));
    expect(cell.font.underline).toBeTruthy();
    expect(cell.fill.fgColor).toEqual({ argb: 'FFF2F2F2' });
    expect(cell.border.top).toEqual({ style: 'thin', color: { argb: 'FF0000FF' } });
    expect(cell.border.left.style).toBe('medium');
    expect(cell.dataValidation).toEqual(
      expect.objectContaining({ type: 'list', formulae: ['"a,b,c"'], allowBlank: true }),
    );
    expect(noteText(cell.note)).toBe('note');
    expect(cell.protection.locked).toBe(false);
    expect(workbook.worksheets[0].sheetProtection).toEqual(expect.objectContaining({ sheet: true, sort: true }));
  });

  it('should hash a sheet password the way ExcelJS does, so Excel asks for it on unprotect', async() => {
    const { workbook, dropped } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 'x';
      b.protect('secret', { sort: true });
    }));
    const protection = workbook.worksheets[0].sheetProtection;

    expect(protection.algorithmName).toBe('SHA-512');
    expect(protection.spinCount).toBe(100000);
    expect(protection.hashValue).toBe(
      Encryptor.convertPasswordToHash('secret', 'SHA512', protection.saltValue, 100000),
    );
    expect(dropped.list()).toEqual([]);
  });

  it('should write layout: widths, heights, hidden, merges, freeze, rtl, state', async() => {
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'a';
      b.cell(1, 2).value = 'b';
      b.setColWidth(1, 5);
      b.setColWidth(2, 12.5);
      b.hideCol(2);
      b.setRowHeight(2, 30);
      b.hideRow(3);
      b.merge(1, 1, 1, 2);
      b.freeze(1, 2);
      b.setRtl(true);
    });
    const helper = new SheetBuilder('_HotValidation');

    helper.cell(1, 1).value = 'x';
    helper.setState('veryHidden');
    snapshot.sheets.push(helper.toSnapshot());

    const { workbook } = await writeAndLoad(snapshot);
    const ws = workbook.worksheets[0];

    expect(ws.getColumn(1).width).toBe(5);
    expect(ws.getColumn(2).width).toBe(12.5);
    expect(ws.getColumn(2).hidden).toBe(true);
    expect(ws.getRow(2).height).toBe(30);
    expect(ws.getRow(3).hidden).toBe(true);
    expect(ws.model.merges).toEqual(['A1:B1']);
    expect(ws.views[0]).toEqual(expect.objectContaining({ state: 'frozen', xSplit: 1, ySplit: 2, rightToLeft: true }));
    expect(workbook.worksheets[1].state).toBe('veryHidden');
  });

  it('should keep the merge master value and skip an overlapping merge with a report', async() => {
    const { workbook, dropped } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 'A1 label';
      b.cell(1, 2).value = 'covered';
      b.merge(1, 1, 2, 2);
      b.merge(2, 2, 3, 3);
    }));
    const ws = workbook.worksheets[0];

    expect(ws.getCell('A1').value).toBe('A1 label');
    expect(ws.model.merges).toEqual(['A1:B2']);
    expect(dropped.list()).toEqual(['merge:overlap']);
  });

  it('should name Handsontable as the author and ask for a full recalculation only when a formula was written', async() => {
    const withFormula = await writeAndLoad(snapshotWith((b) => { b.cell(1, 1).formula = { text: '1+1' }; }));
    const without = await writeAndLoad(snapshotWith((b) => { b.cell(1, 1).value = 1; }));

    expect(withFormula.workbook.creator).toBe('Handsontable');
    expect(withFormula.workbook.lastModifiedBy).toBe('Handsontable');

    const unzip = async bytes => readZip(toArrayBuffer(bytes));

    expect(await (await unzip(withFormula.bytes)).text('xl/workbook.xml')).toContain('fullCalcOnLoad="1"');
    expect(await (await unzip(without.bytes)).text('xl/workbook.xml')).not.toContain('fullCalcOnLoad');
  });

  it('should store the entries uncompressed when compression is off and deflate otherwise', async() => {
    const build = (b) => {
      for (let r = 1; r <= 200; r++) {
        for (let c = 1; c <= 10; c++) {
          b.cell(r, c).value = `repeated value ${c}`;
        }
      }
    };
    const stored = snapshotWith(build);
    const deflated = snapshotWith(build);

    stored.compression = false;
    deflated.compression = 6;

    const storedBytes = await nativeAdapter.write(stored, undefined, new DroppedFeatures());
    const deflatedBytes = await nativeAdapter.write(deflated, undefined, new DroppedFeatures());

    expect(storedBytes.byteLength).toBeGreaterThan(deflatedBytes.byteLength);
  });

  it('should report a numeric compression level other than the default as dropped, since CompressionStream has no level parameter', async() => {
    const snapshot = snapshotWith(() => {});

    snapshot.compression = 9;

    const dropped = new DroppedFeatures();

    await nativeAdapter.write(snapshot, undefined, dropped);

    expect(dropped.list()).toEqual(['compressionLevel']);
  });

  it('should not report compressionLevel when compression is left at its default', async() => {
    const snapshot = snapshotWith(() => {});
    const dropped = new DroppedFeatures();

    await nativeAdapter.write(snapshot, undefined, dropped);

    expect(dropped.list()).toEqual([]);
  });

  it('should not report compressionLevel when compression explicitly equals the default level (6)', async() => {
    const snapshot = snapshotWith(() => {});

    snapshot.compression = 6;

    const dropped = new DroppedFeatures();

    await nativeAdapter.write(snapshot, undefined, dropped);

    expect(dropped.list()).toEqual([]);
  });

  it('should not report compressionLevel when compression is boolean', async() => {
    const stored = snapshotWith(() => {});
    const droppedStored = new DroppedFeatures();

    stored.compression = false;
    await nativeAdapter.write(stored, undefined, droppedStored);
    expect(droppedStored.list()).toEqual([]);
  });

  it('should write conditional formatting ExcelJS reads back', async() => {
    const { workbook } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 5;
      b.addConditionalFormatting('A1:A1', [
        { type: 'cellIs', operator: 'greaterThan', formulae: [2], style: { font: { bold: true } } },
      ]);
    }));
    const cf = workbook.worksheets[0].conditionalFormattings[0];

    expect(cf.ref).toBe('A1:A1');
    expect(cf.rules[0]).toEqual(expect.objectContaining({ type: 'cellIs', operator: 'greaterThan', formulae: ['2'] }));
    expect(cf.rules[0].style.font.bold).toBe(true);
  });

  it('should reject an illegal, reserved, empty, overlong or duplicate sheet name', async() => {
    const cases = [['Q1: Sales', 'illegal'], ['History', 'reserved'], ['', 'empty'], ['x'.repeat(32), '31']];

    for (const [name, reason] of cases) {
      await expect(nativeAdapter.write(snapshotWith(() => {}, name), undefined, new DroppedFeatures()))
        .rejects.toThrow(new RegExp(`sheet name "${name}" was rejected by the native engine.*${reason}`));
    }

    const duplicate = snapshotWith(() => {}, 'Data');

    duplicate.sheets.push(new SheetBuilder('data').toSnapshot());
    await expect(nativeAdapter.write(duplicate, undefined, new DroppedFeatures())).rejects.toThrow(/duplicate/);
  });

  it('should round-trip a workbook through its own reader unchanged', async() => {
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'Name';
      b.cell(2, 1).value = 'Ana García';
      b.cell(2, 2).value = 4200.5;
      b.cell(2, 2).numFmt = '#,##0.00';
      b.cell(2, 3).formula = { text: 'B2*0.2', result: 840.1 };
      b.cell(2, 4).value = true;
      b.cell(2, 4).comment = 'checked';
      b.cell(2, 1).style = {
        alignment: { horizontal: 'right' }, font: { bold: true, color: { argb: 'FFFF0000' } }, fill: null, border: null,
      };
      b.setColWidth(1, 20);
      b.hideCol(3);
      b.setRowHeight(1, 22.5);
      b.merge(1, 1, 1, 2);
      b.freeze(0, 1);
    });
    const bytes = await nativeAdapter.write(snapshot, undefined, new DroppedFeatures());
    const back = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());
    const sheet = back.sheets[0];

    expect(sheet.rows[0][0].value).toBe('Name');
    expect(sheet.rows[0][1]).toBeNull();
    expect(sheet.rows[1][0]).toEqual(expect.objectContaining({
      value: 'Ana García', style: expect.objectContaining({ font: { bold: true, color: { argb: 'FFFF0000' } } }),
    }));
    expect(sheet.rows[1][1]).toEqual(expect.objectContaining({ value: 4200.5, numFmt: '#,##0.00' }));
    expect(sheet.rows[1][2].formula).toEqual({ text: 'B2*0.2', result: 840.1 });
    expect(sheet.rows[1][3]).toEqual(expect.objectContaining({ value: true, comment: 'checked' }));
    expect(sheet.colWidths[0]).toBe(20);
    expect(sheet.hiddenCols).toEqual([2]);
    expect(sheet.rowHeights[0]).toBe(22.5);
    expect(sheet.merges).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
    expect(sheet.freeze).toEqual({ rows: 1, cols: 0 });
  });

  it('should round-trip a cell value that looks like the reader\'s own control-character escape', async() => {
    // `_x0041_` is not a control character; it is a literal string. Left unescaped on write it
    // would be indistinguishable from the `_xHHHH_` a reader writes FOR a real control character,
    // and `decodeOoxmlEscapes` would decode it into `A` on the next read.
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'FILE_x0041_TEST';
    });
    const bytes = await nativeAdapter.write(snapshot, undefined, new DroppedFeatures());
    const back = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());

    expect(back.sheets[0].rows[0][0].value).toBe('FILE_x0041_TEST');
  });
});
