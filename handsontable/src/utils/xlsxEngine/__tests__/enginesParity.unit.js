/**
 * @jest-environment node
 *
 * Proves the native and ExcelJS xlsx engines agree with each other, not merely with themselves.
 * `nativeRead.unit.js` already diffs six unstyled fixtures read by both adapters; this file closes
 * the gaps the parity-matrix audit named: the styled/validation/lossy fixtures on the READ side, and
 * every writer on the WRITE side (nothing compared the two writers before this file existed).
 */
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';
import { inferCellType } from '../../../plugins/importFile/inference';
import { loadFixture as load, rewriteArchive, toArrayBuffer } from './helpers/fixtures';
import { normalizeFont, normalizeStyle, strip } from './helpers/snapshotNormalize';

describe('parity on the number-format fixes of the #13634 review round 4', () => {
  /**
   * Writes a workbook with ExcelJS directly, bypassing both adapters' writers.
   * @param buildFn
   */
  async function writeDirectly(buildFn) {
    const workbook = new ExcelJS.Workbook();

    buildFn(workbook);

    return toArrayBuffer(new Uint8Array(await workbook.xlsx.writeBuffer()));
  }

  async function readBoth(bytes) {
    return {
      native: (await nativeAdapter.read(bytes, undefined, new DroppedFeatures())).sheets[0],
      exceljs: (await excelJsAdapter.read(bytes, ExcelJS, new DroppedFeatures())).sheets[0],
    };
  }

  it('does not shift an elapsed or clock time in a 1904 workbook on either reader, and still shifts a date', async() => {
    // A duration is not a date serial: 12:00 is 0.5 and 25:30 is 1.0625 in either date system.
    // Shifted by 1462 days, a 12:00 duration imported as the number 1462.5.
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      workbook.properties.date1904 = true;
      sheet.addRow([0.5, 25.5 / 24, 2, 0.75, 43844]);
      ['A1', 'B1', 'C1'].forEach((address) => {
        sheet.getCell(address).numFmt = '[h]:mm';
      });
      sheet.getCell('D1').numFmt = 'h:mm';
      sheet.getCell('E1').numFmt = 'yyyy-mm-dd';
    });
    const { native, exceljs } = await readBoth(bytes);
    // 2024-01-15 in the 1900 system.
    const expected = [0.5, 1.0625, 2, 0.75, 45306];

    expect(native.rows[0].map(cell => cell.value)).toEqual(expected);
    expect(exceljs.rows[0].map(cell => cell.value)).toEqual(expected);
  });

  it('reads a duration past its elapsed format as the stored number on both readers, without Date noise', async() => {
    // ExcelJS hands a time-formatted cell over as a `Date`, and converting it back left float noise
    // (`0.0750000000007276`) in the grid value. ExcelJS's `Date` holds whole milliseconds, so a serial
    // finer than that still differs between the readers; these are all millisecond-exact.
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      sheet.addRow([0.075, 1234.5678, 45306.5]);
      sheet.getCell('A1').numFmt = '[mm]:ss';
      sheet.getCell('B1').numFmt = '[h]:mm';
      sheet.getCell('C1').numFmt = 'yyyy-mm-dd hh:mm:ss';
    });
    const { native, exceljs } = await readBoth(bytes);

    expect(native.rows[0].map(cell => cell.value)).toEqual([0.075, 1234.5678, 45306.5]);
    expect(exceljs.rows[0].map(cell => cell.value)).toEqual([0.075, 1234.5678, 45306.5]);
  });

  it('reads a per-character escaped currency as the same currency on both readers', async() => {
    // Excel saves `#,##0.00zł` as `#,##0.00\z\ł`. ExcelJS strips every escape on read; the native
    // reader keeps the code verbatim, so the import has to unescape the run itself.
    const zloty = `z${String.fromCharCode(0x142)}`;
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('S');

      sheet.addRow([1234.5, 1234.5]);
      sheet.getCell('A1').numFmt = `#,##0.00\\${zloty[0]}\\${zloty[1]}`;
      sheet.getCell('B1').numFmt = '\\C\\H\\F#,##0.00';
    });
    const { native, exceljs } = await readBoth(bytes);
    const currencies = sheet => sheet.rows[0].map(cell => inferCellType(cell).numericFormat?.currency);

    expect(currencies(native)).toEqual(['PLN', 'CHF']);
    expect(currencies(exceljs)).toEqual(['PLN', 'CHF']);
  });

  it('round-trips the export\'s quoted currency codes as the same currency on all four legs', async() => {
    const zloty = `z${String.fromCharCode(0x142)}`;
    const codes = ['#,##0.00"USD"', `#,##0.00"${zloty}"`, '"CHF"#,##0.00'];
    const legs = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      codes.forEach((numFmt, index) => {
        sheet.cell(1, index + 1).value = 1234.5;
        sheet.cell(1, index + 1).numFmt = numFmt;
      });
      snapshot.sheets.push(sheet.toSnapshot());
    });

    Object.values(legs).forEach((leg) => {
      expect(leg.sheets[0].rows[0].map(cell => cell.numFmt)).toEqual(codes);
      expect(leg.sheets[0].rows[0].map(cell => inferCellType(cell).numericFormat.currency))
        .toEqual(['USD', 'PLN', 'CHF']);
    });
  });
});

// `strip()` applies the four — and only four — cross-engine normalizations. Their reasons, and
// the rule that no fifth may be added, live at the top of `helpers/snapshotNormalize.js`.

describe('read parity: the styled fixtures the six-fixture loop in nativeRead.unit.js does not reach', () => {
  it('reads styles.xlsx and validation.xlsx to the same snapshot and the same dropped list on both engines', async() => {
    for (const name of ['styles', 'validation']) {
      const nativeDropped = new DroppedFeatures();
      const exceljsDropped = new DroppedFeatures();
      const native = await nativeAdapter.read(load(name), undefined, nativeDropped);
      const viaExcelJs = await excelJsAdapter.read(load(name), ExcelJS, exceljsDropped);

      expect(strip(native)).toEqual(strip(viaExcelJs));
      expect(nativeDropped.list()).toEqual(exceljsDropped.list());
    }
  });

  it('reads lossy.xlsx to the same snapshot on both engines, but the dropped-feature ORDER differs by design', async() => {
    const nativeDropped = new DroppedFeatures();
    const exceljsDropped = new DroppedFeatures();
    const native = await nativeAdapter.read(load('lossy'), undefined, nativeDropped);
    const viaExcelJs = await excelJsAdapter.read(load('lossy'), ExcelJS, exceljsDropped);

    expect(strip(native)).toEqual(strip(viaExcelJs));

    // Same SET of dropped features, different insertion order — `DroppedFeatures#list()` returns
    // first-seen order, and the two readers walk the file differently. The native reader is a
    // single streaming pass over the XML in document order: `richText` is recorded first (a rich
    // shared string is resolved while `<sheetData>` is read, which comes before `<sheetProtection>`,
    // `<autoFilter>`, `<hyperlinks>` and `<drawing>`/`<tableParts>` in the part). The ExcelJS
    // adapter instead records `hyperlink`/`richText` per cell while walking the rows (so its first
    // entry is `hyperlink`, from cell A1, read before B1's rich text), reads sheet protection next,
    // and only afterwards asks `recordUnmodelledSheetFeatures` for images/tables/autoFilter in that
    // fixed code order. This is pinned explicitly, not skipped, so a future change to either
    // reader's pass order fails this test loudly instead of silently.
    expect(nativeDropped.list()).toEqual([
      'richText', 'sheetProtection:password', 'autoFilter', 'hyperlink', 'images', 'tables',
    ]);
    expect(exceljsDropped.list()).toEqual([
      'hyperlink', 'richText', 'sheetProtection:password', 'images', 'tables', 'autoFilter',
    ]);
    expect(nativeDropped.list().sort()).toEqual(exceljsDropped.list().sort());
  });
});

/**
 * Builds a workbook snapshot from scratch by calling `buildFn` on it.
 * @param buildFn
 */
function buildSnapshot(buildFn) {
  const snapshot = createWorkbookSnapshot();

  buildFn(snapshot);

  return snapshot;
}

/**
 * Runs the four-way write-parity check: writes `buildFn`'s snapshot with both engines, then reads
 * EACH engine's bytes with BOTH readers.
 *
 * `buildFn` is invoked twice, once per engine, building two independent snapshot objects rather
 * than sharing one object between the two writers — neither writer mutates its input, but a shared
 * object proves less, and a previous review on this branch specifically flagged that shortcut.
 * @param buildFn
 */
async function fourWayRead(buildFn) {
  const forNative = buildSnapshot(buildFn);
  const forExcelJs = buildSnapshot(buildFn);

  const nativeBytes = await nativeAdapter.write(forNative, undefined, new DroppedFeatures());
  const exceljsBytes = await excelJsAdapter.write(forExcelJs, ExcelJS, new DroppedFeatures());

  const nn = await nativeAdapter.read(toArrayBuffer(nativeBytes), undefined, new DroppedFeatures());
  const ne = await excelJsAdapter.read(toArrayBuffer(nativeBytes), ExcelJS, new DroppedFeatures());
  const en = await nativeAdapter.read(toArrayBuffer(exceljsBytes), undefined, new DroppedFeatures());
  const ee = await excelJsAdapter.read(toArrayBuffer(exceljsBytes), ExcelJS, new DroppedFeatures());

  return { nn, ne, en, ee };
}

/**
 * Asserts that all four legs of `fourWayRead` normalize to the same snapshot. This is the shape
 * that catches a writer emitting something only its OWN reader understands: `nn`/`ee` alone would
 * only prove each engine agrees with itself.
 *
 * Agreement is not survival, though: four legs that ALL lost a feature agree too. So every caller
 * hands `expectNative` the feature it wrote, asserted on the native leg BEFORE the legs are
 * compared — with `SheetBuilder#freeze` writing `null` and `setRtl` writing `false`, the suite
 * passed in full until that callback existed.
 * @param buildFn
 * @param expectNative Receives the native leg's raw snapshot and asserts the feature survived.
 */
async function expectFourWayParity(buildFn, expectNative) {
  const { nn, ne, en, ee } = await fourWayRead(buildFn);
  const [native, nativeViaExcelJs, exceljsViaNative, exceljs] = [nn, ne, en, ee].map(strip);

  expectNative(nn);

  // The three assertions below are equality-only, so four snapshots that had ALL lost the feature
  // under test would agree vacuously — and `normalizeStyle` collapsing a style that carries nothing
  // to `null` is exactly the shape that could erase it. These three positive lines stop the helper
  // from ever going hollow: every caller writes at least one sheet holding at least one non-null
  // cell, so the native leg must come back with one.
  expect(native.length).toBeGreaterThan(0);
  expect(native[0].rows.length).toBeGreaterThan(0);
  expect(native.some(sheet => sheet.rows.some(row => row.some(cell => cell !== null)))).toBe(true);

  expect(nativeViaExcelJs).toEqual(native);
  expect(exceljsViaNative).toEqual(native);
  expect(exceljs).toEqual(native);
}

describe('write parity: a native-written and an ExcelJS-written file agree, read by either reader', () => {
  it('writes cell values of every primitive type, and formulas with and without a cached result', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'text';
      sheet.cell(1, 2).value = 42;
      sheet.cell(1, 3).value = true;
      sheet.cell(1, 4).value = 45292; // a date serial
      sheet.cell(1, 4).numFmt = 'mm-dd-yy';
      sheet.cell(2, 1).formula = { text: 'SUM(B1:B1)' }; // no cached result
      sheet.cell(2, 2).formula = { text: 'B1*2', result: 84 }; // cached result
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      const [first, second] = native.sheets[0].rows;

      expect(first.map(cell => cell.value)).toEqual(['text', 42, true, 45292]);
      expect(first[3].numFmt).toBe('mm-dd-yy');
      expect(second[0].formula).toEqual({ text: 'SUM(B1:B1)' });
      expect(second[1].formula).toEqual({ text: 'B1*2', result: 84 });
    });
  });

  it('reads a falsy cached formula result (0, FALSE) on every leg', async() => {
    // ExcelJS 4.4 copies `result` into the cell value only when it is truthy, so `ne` and `ee` came
    // back with no result for these, and the cells imported empty without the Formulas plugin.
    // LibreOffice writes every boolean literal as `<f>FALSE()</f><v>0</v>`, so its unchecked
    // checkboxes were hit the same way. The adapter reads `cell.result`, which keeps the value.
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 1;
      sheet.cell(1, 2).value = 2;
      sheet.cell(2, 1).formula = { text: 'A1>B1', result: false };
      sheet.cell(2, 2).formula = { text: 'A1-A1', result: 0 };
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      const second = native.sheets[0].rows[1];

      expect(second[0].formula).toEqual({ text: 'A1>B1', result: false });
      expect(second[1].formula).toEqual({ text: 'A1-A1', result: 0 });
    });
  });

  it('documents that the ExcelJS reader loses an empty-string cached result', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).formula = { text: 'LEFT("",1)', result: '' };
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const formulaOf = snapshot => snapshot.sheets[0].rows[0][0].formula;

    // Both writers write `<c t="str"><f>…</f><v></v></c>`. ExcelJS's parser skips the empty `<v>`,
    // so neither the value object nor `cell.result` carries anything the adapter could read back.
    expect(formulaOf(nn)).toEqual({ text: 'LEFT("",1)', result: '' });
    expect(formulaOf(en)).toEqual({ text: 'LEFT("",1)', result: '' });
    expect(formulaOf(ne)).toEqual({ text: 'LEFT("",1)' });
    expect(formulaOf(ee)).toEqual({ text: 'LEFT("",1)' });
  });

  it('writes font attributes (bold, italic, underline, an argb color) the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).style = {
        alignment: null,
        fill: null,
        border: null,
        font: { bold: true, italic: true, underline: true, color: { argb: 'FFFF0000' } },
      };
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0][0].style.font).toEqual(expect.objectContaining({
        bold: true, italic: true, underline: true, color: { argb: 'FFFF0000' },
      }));
    });
  });

  it('writes borders on all four edges (thin/medium/thick, one with a color) unnormalized', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).style = {
        alignment: null,
        font: null,
        fill: null,
        border: {
          top: { style: 'thin' },
          right: { style: 'medium' },
          bottom: { style: 'thick' },
          left: { style: 'thin', color: { argb: 'FF0000FF' } },
        },
      };
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0][0].style.border).toEqual(expect.objectContaining({
        top: { style: 'thin' },
        right: { style: 'medium' },
        bottom: { style: 'thick' },
        left: { style: 'thin', color: { argb: 'FF0000FF' } },
      }));
    });
  });

  it('writes alignment, including vertical "middle" written as "center", unnormalized', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).style = {
        alignment: { horizontal: 'center', vertical: 'middle' }, font: null, fill: null, border: null,
      };
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0][0].style.alignment).toEqual(expect.objectContaining({ horizontal: 'center' }));
    });
  });

  it('writes a built-in and a custom number format the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 45292;
      sheet.cell(1, 1).numFmt = 'mm-dd-yy'; // built-in id 14, identical on both engines
      sheet.cell(1, 2).value = 1234.5;
      sheet.cell(1, 2).numFmt = '#,##0.00 "USD"'; // custom, id 164+
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0].map(cell => cell.numFmt)).toEqual(['mm-dd-yy', '#,##0.00 "USD"']);
    });
  });

  it('writes a cell comment the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).comment = 'a note';
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0][0].comment).toBe('a note');
    });
  });

  it('writes a list validation, both the inline form and a range reference to a helper sheet', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Data');

      sheet.cell(1, 1).value = 'a';
      sheet.cell(1, 1).validation = { type: 'list', formulae: ['"a,b,c"'], allowBlank: true };
      sheet.cell(1, 2).value = 'Open';
      sheet.cell(1, 2).validation = {
        type: 'list', formulae: ['\'_HotValidation\'!$A$1:$A$2'], allowBlank: true,
      };
      snapshot.sheets.push(sheet.toSnapshot());

      const helper = new SheetBuilder('_HotValidation');

      helper.cell(1, 1).value = 'Open';
      helper.cell(2, 1).value = 'Closed';
      helper.setState('veryHidden');
      snapshot.sheets.push(helper.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0].map(cell => cell.validation)).toEqual([
        { type: 'list', formulae: ['"a,b,c"'], allowBlank: true },
        { type: 'list', formulae: ['\'_HotValidation\'!$A$1:$A$2'], allowBlank: true },
      ]);
      expect(native.sheets[1].state).toBe('veryHidden');
    });
  });

  it('writes column widths, row heights, and hidden rows and columns the same way', async() => {
    // Asymmetric on purpose: a hidden column index that differs from the hidden row index, and the
    // fractional widths the export really writes (50 px, 128 px and 100 px), so a writer or reader
    // that swaps the two axes or rounds a width cannot pass. The export gives every column a width,
    // hidden ones included; a hidden column WITHOUT one is the divergence pinned in the next case.
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      sheet.cell(1, 2).value = 'b';
      sheet.cell(1, 3).value = 'hidden column';
      sheet.cell(2, 1).value = 'hidden row';
      sheet.setColWidth(1, 7.142857142857143);
      sheet.setColWidth(2, 18.285714285714285);
      sheet.setColWidth(3, 14.285714285714286);
      sheet.hideCol(3);
      sheet.setRowHeight(1, 25);
      sheet.hideRow(2);
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      const [sheet] = native.sheets;

      expect(sheet.colWidths).toEqual([7.142857142857143, 18.285714285714285, 14.285714285714286]);
      expect(sheet.hiddenCols).toEqual([2]);
      expect(sheet.rowHeights[0]).toBe(25);
      expect(sheet.hiddenRows).toEqual([1]);
    });
  });

  it('pins the width a hidden column with no width of its own reads back as on each leg', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      sheet.cell(1, 3).value = 'hidden column';
      sheet.setColWidth(1, 7.142857142857143);
      sheet.hideCol(3);
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const widthsOf = snapshot => snapshot.sheets[0].colWidths;

    // Finding, asserted with every leg's value rather than normalized: the native writer writes
    // `<col min="3" max="3" hidden="1"/>` with no width, and the native reader keeps that as no
    // width. ExcelJS fills in its own default column width of 9 on both sides: its writer writes
    // `width="9" customWidth="1"` for the hidden column, and its reader reports 9 for the native
    // writer's width-less `<col>`. The export always sets a width, so no export reaches this.
    expect(widthsOf(nn)).toEqual([7.142857142857143, null, null]);
    expect(widthsOf(ne)).toEqual([7.142857142857143, null, 9]);
    expect(widthsOf(en)).toEqual([7.142857142857143, null, 9]);
    expect(widthsOf(ee)).toEqual([7.142857142857143, null, 9]);
    [nn, ne, en, ee].forEach(snapshot => expect(snapshot.sheets[0].hiddenCols).toEqual([2]));
  });

  it('writes frozen panes, right-to-left, a hidden and a veryHidden sheet the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      // Two columns and one row, so `xSplit` and `ySplit` cannot be swapped unnoticed.
      sheet.freeze(2, 1);
      sheet.setRtl(true);
      snapshot.sheets.push(sheet.toSnapshot());

      const veryHidden = new SheetBuilder('VeryHidden');

      veryHidden.cell(1, 1).value = 'x';
      veryHidden.setState('veryHidden');
      snapshot.sheets.push(veryHidden.toSnapshot());

      const hidden = new SheetBuilder('Hidden');

      hidden.cell(1, 1).value = 'y';
      hidden.setState('hidden');
      snapshot.sheets.push(hidden.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].freeze).toEqual({ rows: 1, cols: 2 });
      expect(native.sheets[0].rtl).toBe(true);
      expect(native.sheets.map(sheet => sheet.state)).toEqual(['visible', 'veryHidden', 'hidden']);
    });
  });

  it('writes a conditional-formatting block the same way (compared by ref, per legitimate difference #2)', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 5;
      sheet.cell(2, 1).value = 10;
      sheet.addConditionalFormatting('A1:A2', [
        { type: 'cellIs', operator: 'greaterThan', formulae: [2], style: { font: { bold: true } } },
      ]);
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(cfShape(native)).toEqual([{
        ref: 'A1:A2',
        count: 1,
        rules: [{
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['2'],
          text: null,
          rank: null,
          style: {
            font: { bold: true, italic: undefined, underline: undefined, color: undefined },
            fill: null,
            border: null,
          },
        }],
      }]);
    });
  });

  it('writes a solid argb fill identically on all four legs', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).style = {
        alignment: null,
        font: null,
        border: null,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } },
      };
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const fillOf = snapshot => snapshot.sheets[0].rows[0][0].style.fill;
    const plainFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };

    // The native writer used to emit a companion `<bgColor indexed="64"/>` beside the `<fgColor>`,
    // which only ExcelJS's reader surfaced — so the `ne` leg alone carried an extra
    // `bgColor: { indexed: 64 }`. The companion element is gone, so all four legs agree exactly.
    [nn, ne, en, ee].forEach(snapshot => expect(fillOf(snapshot)).toEqual(plainFill));
  });

  it('writes a per-cell unlock and sheet protection options identically on all four legs', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).locked = false;
      sheet.cell(1, 2).value = 'y';
      sheet.protect('', {
        formatColumns: true, sort: true, autoFilter: true, selectLockedCells: false, selectUnlockedCells: false,
      });
      snapshot.sheets.push(sheet.toSnapshot());
    });

    [nn, ne, en, ee].forEach((snapshot) => {
      const row = snapshot.sheets[0].rows[0];

      expect(row[0].locked).toBe(false);
      expect(row[1].locked).toBeNull();
      expect(snapshot.sheets[0].protection.enabled).toBe(true);
      expect(snapshot.sheets[0].protection.password).toBeNull();
      // The two select permissions are inverted in OOXML like `objects`/`scenarios`, and the export
      // always passes `true` for both, so only this case writes and reads back a denied one.
      expect(snapshot.sheets[0].protection.options).toEqual(expect.objectContaining({
        formatColumns: true, sort: true, autoFilter: true, selectLockedCells: false, selectUnlockedCells: false,
      }));

      // `objects` and `scenarios` are permissions like any other: the attribute is written only
      // when the caller asked for `false`, so neither key exists on any leg here. The native writer
      // used to emit `objects="1" scenarios="1"` unconditionally, which ExcelJS's reader — which
      // inverts both — turned into `objects: false, scenarios: false` on native bytes alone.
      expect(snapshot.sheets[0].protection.options).not.toHaveProperty('objects');
      expect(snapshot.sheets[0].protection.options).not.toHaveProperty('scenarios');
    });
  });

  it('writes an explicitly denied objects/scenarios permission identically on all four legs', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.protect('', { objects: false, scenarios: false });
      snapshot.sheets.push(sheet.toSnapshot());
    });

    [nn, ne, en, ee].forEach((snapshot) => {
      expect(snapshot.sheets[0].protection.options).toEqual(expect.objectContaining({
        objects: false, scenarios: false,
      }));
    });
  });

  it('writes merged cells, dropping a covered cell\'s content and padding the row on all four legs', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'master';
      sheet.cell(1, 2).value = 'covered';
      sheet.merge(1, 1, 1, 2);
      snapshot.sheets.push(sheet.toSnapshot());
    });

    // Every leg pads the covered cell to an explicit `null`, matching the model's documented
    // "padded to sheet width" contract. Both writers emit a `<c>` for every covered member, so this
    // is a round trip; the reader's merge pass for a member with no `<c>` at all (another producer's
    // file) is pinned in `nativeRead.unit.js` and `nativeParts.unit.js`.
    [nn, ne, en, ee].forEach((snapshot) => {
      expect(snapshot.sheets[0].rows[0][0].value).toBe('master');
      expect(snapshot.sheets[0].merges).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
      expect(snapshot.sheets[0].rows[0]).toHaveLength(2);
      expect(snapshot.sheets[0].rows[0][1]).toBeNull();
    });
  });

  it('writes several merges of different shapes, all of them, on all four legs', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'square';
      sheet.cell(3, 3).value = 'wide';
      sheet.cell(6, 1).value = 'tall';
      sheet.merge(1, 1, 2, 2);
      sheet.merge(3, 3, 3, 5);
      sheet.merge(6, 1, 8, 1);
      snapshot.sheets.push(sheet.toSnapshot());
    });

    // `toEqual` on the whole list: a writer that keeps only the first merge, or a reader that stops
    // after one, passes every single-merge case above.
    [nn, ne, en, ee].forEach((snapshot) => {
      expect(snapshot.sheets[0].merges).toEqual([
        { row: 0, col: 0, rowspan: 2, colspan: 2 },
        { row: 2, col: 2, rowspan: 1, colspan: 3 },
        { row: 5, col: 0, rowspan: 3, colspan: 1 },
      ]);
    });
  });

  it('writes a row of NaN, Infinity and -Infinity as text on the native engine, and pins ExcelJS still writing them raw', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = NaN;
      sheet.cell(1, 2).value = Infinity;
      sheet.cell(1, 3).value = -Infinity;
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const valuesOf = snapshot => snapshot.sheets[0].rows[0].map(cell => (cell === null ? null : cell.value));

    // The native writer refuses to put a non-finite number in a `<v>`: `<v>NaN</v>` is not a legal
    // cell value and Excel offers to repair such a file. It writes the three as shared strings
    // instead, and BOTH readers agree on what came out, so the demotion is not something only
    // native's own reader understands.
    expect(valuesOf(nn)).toEqual(['NaN', 'Infinity', '-Infinity']);
    expect(valuesOf(ne)).toEqual(['NaN', 'Infinity', '-Infinity']);

    // Finding, pinned rather than normalized: ExcelJS's writer has no such guard and still emits
    // `<v>NaN</v>` / `<v>Infinity</v>` verbatim — the file Excel refuses to open. The two readers
    // then disagree about what that even is: the native reader rejects a `<v>` that does not parse
    // to a finite number and reports an empty cell, while ExcelJS's own reader hands the non-finite
    // number straight back. Nothing in this repository can fix that writer, so the export plugin
    // coerces a non-finite number to text before either engine sees it
    // (`exportFile/__tests__/xlsxNonFiniteValues.unit.js`); this leg describes only a snapshot
    // handed straight to the ExcelJS adapter.
    expect(valuesOf(en)).toEqual([null, null, null]);
    expect(valuesOf(ee)).toEqual([NaN, Infinity, -Infinity]);
  });

  it('keeps every digit of a number on all four legs, compared raw rather than through strip()', async() => {
    // `strip()` rounds a value to nine decimals, which makes `1.5e-10` equal `0`, so these legs are
    // read raw: a writer or reader that rounds, or keeps fewer than 17 significant digits, fails here.
    const values = [12345678901.23, 0.1 + 0.2, 1.5e-10, Number.MAX_SAFE_INTEGER, -0.000001, 1e21, 5e-324];
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      values.forEach((value, index) => {
        sheet.cell(1, index + 1).value = value;
      });
      snapshot.sheets.push(sheet.toSnapshot());
    });

    [nn, ne, en, ee].forEach((snapshot) => {
      expect(snapshot.sheets[0].rows[0].map(cell => cell.value)).toEqual(values);
    });
  });

  it('reads built-in numFmt id 22 as the ECMA-376 code on both readers', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 45292.5;
      sheet.cell(1, 1).numFmt = 'm/d/yy h:mm'; // native's ECMA-376 string for built-in id 22
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const numFmtOf = snapshot => snapshot.sheets[0].rows[0][0].numFmt;

    // A numFmtId of 22 with no `<numFmts>` override means "whatever the reader's built-in table
    // says id 22 is". ExcelJS's table says `m/d/yy "h":mm`, whose quoted `h` is a literal letter, so
    // a native-written date-time read through ExcelJS (`ne`) imported as a date and lost its time
    // of day. The adapter maps that spelling back, so all four legs agree.
    expect(numFmtOf(nn)).toBe('m/d/yy h:mm');
    expect(numFmtOf(ne)).toBe('m/d/yy h:mm');
    expect(numFmtOf(en)).toBe('m/d/yy h:mm');
    expect(numFmtOf(ee)).toBe('m/d/yy h:mm');
  });
});

describe('parity on the capabilities the matrix listed without a direct two-engine test', () => {
  /**
   * Writes a workbook with ExcelJS directly, bypassing both adapters' writers, so a file shape the
   * neutral snapshot cannot express (a theme color, rich text nested in a hyperlink) can still be
   * fed to both readers.
   * @param buildFn
   */
  async function writeWithExcelJsDirectly(buildFn) {
    const workbook = new ExcelJS.Workbook();

    buildFn(workbook);

    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());

    return toArrayBuffer(bytes);
  }

  it('drops a theme font color identically, and pins the theme FILL only ExcelJS surfaces', async() => {
    const bytes = await writeWithExcelJsDirectly((workbook) => {
      const sheet = workbook.addWorksheet('Themed');

      sheet.getCell('A1').value = 'themed';
      sheet.getCell('A1').font = { bold: true, color: { theme: 1 } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { theme: 5 } };
      sheet.getCell('B1').value = 'indexed';
      sheet.getCell('B1').font = { color: { indexed: 10 } };
    });
    const native = await nativeAdapter.read(bytes, undefined, new DroppedFeatures());
    const viaExcelJs = await excelJsAdapter.read(bytes, ExcelJS, new DroppedFeatures());
    const styleOf = (snapshot, col) => snapshot.sheets[0].rows[0][col].style;

    // The font half agrees exactly: `argbOf()` returns nothing for a color with no `rgb`, so the
    // native reader keeps only `bold`, and the ExcelJS reader's `{ theme: 1 }` carries no `argb`
    // either — the model tracks an argb color and nothing else, so both resolve to the same font.
    expect(normalizeFont(styleOf(native, 0).font)).toEqual(normalizeFont(styleOf(viaExcelJs, 0).font));
    expect(styleOf(native, 0).font).toEqual({ bold: true });
    expect(styleOf(viaExcelJs, 0).font).toEqual({ bold: true, color: { theme: 1 } });

    // A cell whose ONLY color is an indexed one resolves to no style at all on the native reader,
    // and to a font/fill that `normalizeFont`/`normalizeFill` collapse to nothing on ExcelJS's.
    expect(styleOf(native, 1)).toBeNull();
    expect(normalizeStyle(styleOf(viaExcelJs, 1))).toBeNull();

    // Finding, and one the parity matrix recorded the other way round ("both drop it, by design"):
    // the two engines do NOT agree on a theme FILL. `CellStyleSnapshot['fill']` declares
    // `fgColor: { argb: string }`, so a color the model cannot express has nowhere to go — the
    // native reader drops the whole fill, while the ExcelJS adapter passes ExcelJS's own fill
    // object straight through and leaks `{ theme: 5 }` into a field typed as an argb color. Native
    // is the one that honors the contract here, so this is pinned rather than "fixed" by widening
    // the model. It is asserted explicitly, not normalized away.
    expect(styleOf(native, 0).fill).toBeNull();
    expect(styleOf(viaExcelJs, 0).fill).toEqual({ type: 'pattern', pattern: 'solid', fgColor: { theme: 5 } });
  });

  it('drops rich text nested inside a hyperlink to the same set of features on both engines', async() => {
    const bytes = await writeWithExcelJsDirectly((workbook) => {
      const sheet = workbook.addWorksheet('Links');

      sheet.getCell('A1').value = {
        text: { richText: [{ text: 'Hand', font: { bold: true } }, { text: 'sontable' }] },
        hyperlink: 'https://handsontable.com',
      };
    });
    const nativeDropped = new DroppedFeatures();
    const exceljsDropped = new DroppedFeatures();
    const native = await nativeAdapter.read(bytes, undefined, nativeDropped);
    const viaExcelJs = await excelJsAdapter.read(bytes, ExcelJS, exceljsDropped);

    // The matrix flagged this as the one shape whose mechanism differs: ExcelJS inspects the VALUE
    // and finds the rich text nested in the hyperlink object, while the native reader records
    // `hyperlink` from the `<hyperlink>` element and `richText` from the shared string's own rich
    // flag. Both paths land on the same two features and the same joined display text.
    expect(native.sheets[0].rows[0][0].value).toBe('Handsontable');
    expect(viaExcelJs.sheets[0].rows[0][0].value).toBe('Handsontable');

    // Compared as SETS: the insertion ORDER is the already-pinned lossy-order difference above.
    expect(new Set(nativeDropped.list())).toEqual(new Set(exceljsDropped.list()));
    expect(nativeDropped.list().slice().sort()).toEqual(['hyperlink', 'richText']);
  });

  it('agrees on built-in numFmt ids 39 and 40, unlike id 22', async() => {
    // `AGENTS.md` claimed ids 39 and 40 differ from ExcelJS's table "by a space"; they do not.
    // ExcelJS's `lib/xlsx/defaultnumformats.js` carries the identical ECMA-376 strings for both
    // (only id 22 disagrees, pinned above), so a cell that names either by its built-in code reads
    // back byte-identical on all four legs. Pinned here so the claim cannot rot in either
    // direction: a change to either table fails this test.
    for (const code of ['#,##0.00 ;(#,##0.00)', '#,##0.00 ;[Red](#,##0.00)']) {
      const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
        const sheet = new SheetBuilder('Sheet1');

        sheet.cell(1, 1).value = -1234.5;
        sheet.cell(1, 1).numFmt = code;
        snapshot.sheets.push(sheet.toSnapshot());
      });

      [nn, ne, en, ee].forEach(snapshot => expect(snapshot.sheets[0].rows[0][0].numFmt).toBe(code));
    }
  });
});

/**
 * Reduces a rule's differential style to what a user sees of it. A dxf `<patternFill>` with no
 * `patternType` is solid (ECMA-376 §18.8.32), and one reader reports that default while the other
 * leaves it unset, so an unset pattern compares as `solid`.
 *
 * @param {object} style The rule's `style`.
 * @returns {object|null}
 */
function normalizeDxf(style) {
  const font = normalizeFont(style.font);
  const fill = style.fill
    ? {
      pattern: style.fill.pattern ?? 'solid',
      bgColor: style.fill.bgColor ?? null,
      fgColor: style.fill.fgColor ?? null,
    }
    : null;
  const border = style.border && Object.keys(style.border).length > 0 ? style.border : null;

  return font || fill || border ? { font, fill, border } : null;
}

/**
 * Reduces each leg's conditional formatting to what a user sees of it.
 *
 * @param {object} snapshot The workbook snapshot.
 * @returns {Array}
 */
function cfShape(snapshot) {
  return snapshot.sheets[0].conditionalFormatting.map(block => ({
    ref: block.ref,
    count: block.rules.length,
    rules: block.rules.map(rule => ({
      type: rule.type,
      operator: rule.operator ?? null,
      // Formulae are compared as text: the export hands numbers, and both readers answer strings.
      formulae: Array.isArray(rule.formulae) ? rule.formulae.map(String) : [],
      text: rule.text ?? null,
      rank: rule.rank ?? null,
      // The differential style, the part of a rule a user sees; dropping the `dxfId` on write, or
      // `rule.style` on read, passed every case here before.
      style: rule.style ? normalizeDxf(rule.style) : null,
    })),
  }));
}

/**
 * Builds a one-sheet snapshot carrying a single conditional-formatting block over `A1:A2`.
 * @param rules
 */
function cfSnapshot(rules) {
  return (snapshot) => {
    const sheet = new SheetBuilder('Sheet1');

    sheet.cell(1, 1).value = 5;
    sheet.cell(2, 1).value = 10;
    sheet.addConditionalFormatting('A1:A2', rules);
    snapshot.sheets.push(sheet.toSnapshot());
  };
}

const CF_STYLE = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } } };

// Every rule kind and operator `exportFile` can hand to `SheetBuilder#addConditionalFormatting`
// that the native writer serializes. The plugin passes a `ConditionalFormattingRule` through
// verbatim (`types/xlsx.ts`'s `#applyConditionalFormatting`), so the set is exactly the switch in
// `adapters/native/parts/conditionalFormatting.ts`.
const WRITTEN_CF_KINDS = [
  ['expression', [{ type: 'expression', formulae: ['A1>3'], style: CF_STYLE }]],
  ['cellIs/greaterThan', [{ type: 'cellIs', operator: 'greaterThan', formulae: [2], style: CF_STYLE }]],
  ['cellIs/lessThan', [{ type: 'cellIs', operator: 'lessThan', formulae: [9], style: CF_STYLE }]],
  ['cellIs/equal', [{ type: 'cellIs', operator: 'equal', formulae: [5], style: CF_STYLE }]],
  ['cellIs/notEqual', [{ type: 'cellIs', operator: 'notEqual', formulae: [5], style: CF_STYLE }]],
  ['cellIs/between', [{ type: 'cellIs', operator: 'between', formulae: [1, 9], style: CF_STYLE }]],
  ['containsText', [{ type: 'containsText', operator: 'containsText', text: 'ab', style: CF_STYLE }]],
  ['containsBlanks', [{ type: 'containsText', operator: 'containsBlanks', style: CF_STYLE }]],
  ['notContainsBlanks', [{ type: 'containsText', operator: 'notContainsBlanks', style: CF_STYLE }]],
  ['containsErrors', [{ type: 'containsText', operator: 'containsErrors', style: CF_STYLE }]],
  ['notContainsErrors', [{ type: 'containsText', operator: 'notContainsErrors', style: CF_STYLE }]],
  ['top10', [{ type: 'top10', rank: 3, percent: false, bottom: false, style: CF_STYLE }]],
  ['aboveAverage', [{ type: 'aboveAverage', aboveAverage: true, style: CF_STYLE }]],
  ['timePeriod', [{
    type: 'timePeriod', timePeriod: 'today', formulae: ['FLOOR(A1,1)=TODAY()'], style: CF_STYLE,
  }]],
];

// The kinds the native writer refuses. ExcelJS writes every one of them, so this is documented
// deliberate difference #3 (native writes a strict subset of OOXML's rule kinds).
const DROPPED_CF_KINDS = [
  ['dataBar', [{
    type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF638EC6' },
  }]],
  ['colorScale', [{
    type: 'colorScale',
    cfvo: [{ type: 'min' }, { type: 'max' }],
    color: [{ argb: 'FFF8696B' }, { argb: 'FF63BE7B' }],
  }]],
  ['iconSet', [{
    type: 'iconSet',
    iconSet: '3TrafficLights',
    cfvo: [{ type: 'percent', value: 0 }, { type: 'percent', value: 33 }, { type: 'percent', value: 67 }],
  }]],
  ['duplicateValues', [{ type: 'duplicateValues', style: CF_STYLE }]],
];

describe('conditional formatting: every rule kind the export can produce, four ways', () => {
  it.each(WRITTEN_CF_KINDS)('writes and reads a %s rule the same way on all four legs', async(_, rules) => {
    const { nn, ne, en, ee } = await fourWayRead(cfSnapshot(rules));
    const [native, nativeViaExcelJs, exceljsViaNative, exceljs] = [nn, ne, en, ee].map(cfShape);
    const [written] = rules;

    expect(native).toHaveLength(1);
    expect(native[0].count).toBe(1);
    // The feature itself survives on the native leg, before the legs are compared with each other.
    expect(native[0].rules[0].type).toBe(written.type);
    expect(native[0].rules[0].text).toBe(written.text ?? null);
    expect(native[0].rules[0].rank).toBe(written.rank ?? null);
    (written.formulae ?? []).forEach(formula => expect(native[0].rules[0].formulae).toContain(String(formula)));

    if (written.text !== undefined) {
      // Finding, pinned with every leg's value rather than normalized: ExcelJS neither WRITES a
      // `containsText` rule's `text` attribute (its `renderText` emits type, operator and the
      // formula only) nor READS one back (`cf-rule-xform.js` maps no `text`), so only the native
      // round trip keeps it. The formula, which is what Excel evaluates, agrees on all four legs.
      expect([nativeViaExcelJs, exceljsViaNative, exceljs].map(shape => shape[0].rules[0].text))
        .toEqual([null, null, null]);

      const withText = shape => shape.map(block => ({
        ...block, rules: block.rules.map(rule => ({ ...rule, text: written.text })),
      }));

      expect(withText(nativeViaExcelJs)).toEqual(native);
      expect(withText(exceljsViaNative)).toEqual(native);
      expect(withText(exceljs)).toEqual(native);

      return;
    }

    expect(nativeViaExcelJs).toEqual(native);
    expect(exceljsViaNative).toEqual(native);
    expect(exceljs).toEqual(native);
  });

  it.each(DROPPED_CF_KINDS)('records %s as dropped on native while ExcelJS writes it', async(kind, rules) => {
    const nativeDropped = new DroppedFeatures();
    const exceljsDropped = new DroppedFeatures();
    const forNative = buildSnapshot(cfSnapshot(rules));
    const forExcelJs = buildSnapshot(cfSnapshot(rules));
    const nativeBytes = await nativeAdapter.write(forNative, undefined, nativeDropped);
    const exceljsBytes = await excelJsAdapter.write(forExcelJs, ExcelJS, exceljsDropped);

    // Deliberate difference #3, pinned explicitly: the native writer serializes a strict SUBSET of
    // OOXML's rule kinds and records the rest, ExcelJS writes them all and records nothing. The
    // `dropped` lists therefore do NOT match for these four kinds, and that is the documented
    // behavior rather than a defect.
    expect(nativeDropped.list()).toEqual([`conditionalFormatting:${kind}`]);
    expect(exceljsDropped.list()).toEqual([]);

    const nn = await nativeAdapter.read(toArrayBuffer(nativeBytes), undefined, new DroppedFeatures());
    const ne = await excelJsAdapter.read(toArrayBuffer(nativeBytes), ExcelJS, new DroppedFeatures());
    const enDropped = new DroppedFeatures();
    const en = await nativeAdapter.read(toArrayBuffer(exceljsBytes), undefined, enDropped);
    const ee = await excelJsAdapter.read(toArrayBuffer(exceljsBytes), ExcelJS, new DroppedFeatures());

    // A block whose every rule was refused is not written at all, so both readers agree there is
    // nothing there in the native-written file.
    expect(cfShape(nn)).toEqual([]);
    expect(cfShape(ne)).toEqual([]);

    // The ExcelJS-written file carries the rule. `duplicateValues` is the exception: ExcelJS's own
    // writer emits an empty block for it, so both readers report zero rules.
    expect(cfShape(ee)[0].ref).toBe('A1:A2');
    expect(cfShape(ee)[0].count).toBe(kind === 'duplicateValues' ? 0 : 1);

    if (kind === 'duplicateValues') {
      expect(cfShape(en)).toEqual(cfShape(ee));

      return;
    }

    // A color scale, a data bar and an icon set live in child elements the native READER does not
    // read either: it leaves the rule out and records it, rather than import a bare
    // `{ type, priority }` that the ExcelJS export then threw on. ExcelJS reads the whole rule.
    expect(cfShape(en)).toEqual([{ ref: 'A1:A2', count: 0, rules: [] }]);
    expect(enDropped.list()).toEqual([`conditionalFormatting:${kind}`]);
    expect(ee.sheets[0].conditionalFormatting[0].rules[0].cfvo).toEqual(rules[0].cfvo);
  });
});

// Every illegal sheet name the two writers are asked about. `native` and `exceljs` record the
// outcome each writer actually produces — compared as accept/reject only, never by message text.
const SHEET_NAMES = [
  ['an empty name', '', 'rejected', 'rejected'],
  ['an asterisk', 'a*b', 'rejected', 'rejected'],
  ['a question mark', 'a?b', 'rejected', 'rejected'],
  ['a colon', 'a:b', 'rejected', 'rejected'],
  ['a forward slash', 'a/b', 'rejected', 'rejected'],
  ['a backslash', 'a\\b', 'rejected', 'rejected'],
  ['an opening bracket', 'a[b', 'rejected', 'rejected'],
  ['a closing bracket', 'a]b', 'rejected', 'rejected'],
  ['a leading apostrophe', '\'ab', 'rejected', 'rejected'],
  ['a trailing apostrophe', 'ab\'', 'rejected', 'rejected'],
  ['the reserved name History', 'History', 'rejected', 'rejected'],
  ['a legal name', 'Sheet1', 'accepted', 'accepted'],
  // ExcelJS writes the name as it is handed; the native writer refuses it, because its attribute
  // escaper and its element escaper would write two different names into two parts.
  ['a control character', 'a\u0001b', 'rejected', 'accepted'],
  // The rows the engines disagree on, pinned with both outcomes rather than skipped.
  ['a name over 31 characters', 'x'.repeat(32), 'rejected', 'accepted'],
  ['History in lower case', 'history', 'rejected', 'accepted'],
  ['History in upper case', 'HISTORY', 'rejected', 'accepted'],
];

describe('sheet-name validation: the same illegal set through both writers, outcome only', () => {
  /**
   * Writes a workbook whose sheets are named `names` with `adapter` and answers whether it was
   * accepted.
   *
   * The ExcelJS side is outcome-only on purpose: the two engines word their refusals differently,
   * and pinning ExcelJS's wording here would pin a dependency's text rather than our contract. The
   * NATIVE side is not blanket-outcome-only, though — a `TypeError` raised inside this helper, or a
   * rejection for a reason that has nothing to do with the sheet name, would otherwise read as the
   * sheet-name rule working. So a native rejection must be a Handsontable error whose message names
   * that rule. `nativeWrite.unit.js` asserts the per-reason wording for four of these rows; this
   * check is the floor under the other eleven.
   * @param adapter
   * @param engine
   * @param names
   */
  async function outcomeOf(adapter, engine, names) {
    const snapshot = createWorkbookSnapshot();

    names.forEach(name => snapshot.sheets.push(new SheetBuilder(name).toSnapshot()));

    try {
      await adapter.write(snapshot, engine, new DroppedFeatures());

      return 'accepted';
    } catch (error) {
      if (adapter === nativeAdapter) {
        expect(error.message).toMatch(/was rejected by the native engine/);
        expect(error.cause).toMatchObject({ handsontable: true });
      }

      return 'rejected';
    }
  }

  it.each(SHEET_NAMES)('pins the accept/reject outcome for %s', async(_, name, nativeOutcome, exceljsOutcome) => {
    // Four rows disagree, and all four are the ExcelJS side being the lenient one: it writes a name
    // holding a control character as it is handed, it TRUNCATES a name over 31 characters with a
    // console warning instead of refusing it, and its reserved-name check is `name === 'History'`
    // exactly, so `history` and `HISTORY` pass. The native writer refuses all four.
    // Asserted with each engine's real outcome so neither can drift unnoticed.
    expect(await outcomeOf(nativeAdapter, undefined, [name])).toBe(nativeOutcome);
    expect(await outcomeOf(excelJsAdapter, ExcelJS, [name])).toBe(exceljsOutcome);
  });

  it.each([['an exact duplicate', 'Data'], ['a duplicate differing only in case', 'DATA']])(
    'rejects %s on both writers', async(_, second) => {
      expect(await outcomeOf(nativeAdapter, undefined, ['Data', second])).toBe('rejected');
      expect(await outcomeOf(excelJsAdapter, ExcelJS, ['Data', second])).toBe('rejected');
    },
  );
});

describe('parity on the writer and reader fixes of the #13634 review round', () => {
  it('writes a post-2007 function with the prefix Excel stores, on both writers', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 1;
      sheet.cell(1, 2).formula = { text: 'IFS(A1>0,"pos",TRUE,"neg")', result: 'pos' };
      sheet.cell(1, 3).formula = { text: 'SUM(_xlfn.XLOOKUP(1,A1:A1,A1:A1))', result: 1 };
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      // Neither reader strips the prefix (that is `importFile`'s mapper), so every leg reads the
      // stored form — and it is the one Excel needs, or the cell shows `#NAME?` until re-entered.
      expect(native.sheets[0].rows[0][1].formula.text).toBe('_xlfn.IFS(A1>0,"pos",TRUE,"neg")');
      expect(native.sheets[0].rows[0][2].formula.text).toBe('SUM(_xlfn.XLOOKUP(1,A1:A1,A1:A1))');
    });
  });

  it('reads a list validation that leaves allowBlank out as allowBlank: false on both readers', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      // The native writer leaves the attribute out for `false`, which is the OOXML default.
      sheet.cell(1, 1).validation = { type: 'list', formulae: ['"a,b"'], allowBlank: false };
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].rows[0][0].validation).toEqual({ type: 'list', formulae: ['"a,b"'], allowBlank: false });
    });
  });

  it('keeps a covered merge cell\'s own lock and style, without a value, on both readers', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'merged';
      sheet.cell(1, 2).locked = false;
      sheet.cell(1, 2).style = {
        alignment: null, font: { bold: true }, fill: null, border: null,
      };
      sheet.merge(1, 1, 1, 2);
      sheet.protect('');
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      // Both readers blanked a covered cell to `null`, so its `locked="0"` was lost and the import
      // made it read-only under sheet protection.
      expect(native.sheets[0].rows[0][1]).toEqual(expect.objectContaining({
        value: null, formula: null, locked: false, style: expect.objectContaining({ font: { bold: true } }),
      }));
    });
  });

  it('does not write a single-cell merge on either writer', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      sheet.cell(1, 2).value = 'b';
      sheet.merge(1, 1, 1, 1);
      sheet.merge(1, 2, 1, 3);
      snapshot.sheets.push(sheet.toSnapshot());
    }, (native) => {
      expect(native.sheets[0].merges).toEqual([{ row: 0, col: 1, rowspan: 1, colspan: 2 }]);
      expect(native.sheets[0].rows[0][0].value).toBe('a');
    });
  });

  it('clamps a column width and a row height to Excel\'s maximum on both writers, and reports both', async() => {
    const build = (snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      sheet.setColWidth(1, 300);
      sheet.setRowHeight(1, 500);
      snapshot.sheets.push(sheet.toSnapshot());
    };

    await expectFourWayParity(build, (native) => {
      // Without the clamp the native reader DISCARDED both values (above 260 units / 409.5 pt), so
      // a very wide column came back at the default width instead of at the widest one Excel has.
      expect(native.sheets[0].colWidths[0]).toBe(260);
      expect(native.sheets[0].rowHeights[0]).toBe(409.5);
    });

    for (const [adapter, engine] of [[nativeAdapter, undefined], [excelJsAdapter, ExcelJS]]) {
      const dropped = new DroppedFeatures();

      await adapter.write(buildSnapshot(build), engine, dropped);

      expect(dropped.list()).toEqual(['columnWidth:clamped', 'rowHeight:clamped']);
    }
  });

  it('truncates a string past Excel\'s 32767-character cell limit on both writers, and reports it', async() => {
    const build = (snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x'.repeat(40000);
      snapshot.sheets.push(sheet.toSnapshot());
    };

    await expectFourWayParity(build, (native) => {
      expect(native.sheets[0].rows[0][0].value).toBe('x'.repeat(32767));
    });

    for (const [adapter, engine] of [[nativeAdapter, undefined], [excelJsAdapter, ExcelJS]]) {
      const dropped = new DroppedFeatures();

      await adapter.write(buildSnapshot(build), engine, dropped);

      expect(dropped.list()).toEqual(['cellText:truncated']);
    }
  });

  /**
   * Writes a workbook with ExcelJS directly, bypassing both adapters' writers.
   * @param buildFn
   */
  async function writeDirectly(buildFn) {
    const workbook = new ExcelJS.Workbook();

    buildFn(workbook);

    return toArrayBuffer(new Uint8Array(await workbook.xlsx.writeBuffer()));
  }

  it('imports an Excel 365 threaded comment as its thread text on both readers, and records it once', async() => {
    // The legacy note Excel 365 writes for a threaded comment opens with fixed boilerplate; both
    // readers strip it through one shared helper and report the flattened thread.
    const boilerplate = '[Threaded comment]\n\nYour version of Excel allows you to read this threaded comment; '
      + 'however, any edits to it will get removed if the file is opened in a newer version of Excel. '
      + 'Learn more: https://go.microsoft.com/fwlink/?linkid=870924\n\nComment:\n    ';
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('Sheet1');

      sheet.getCell('A1').value = 1;
      sheet.getCell('A1').note = `${boilerplate}Is this right?\nReply:\n    Yes.`;
      sheet.getCell('B1').value = 2;
      sheet.getCell('B1').note = `${boilerplate}Another thread`;
    });
    const nativeDropped = new DroppedFeatures();
    const exceljsDropped = new DroppedFeatures();
    const native = await nativeAdapter.read(bytes, undefined, nativeDropped);
    const viaExcelJs = await excelJsAdapter.read(bytes, ExcelJS, exceljsDropped);

    expect(native.sheets[0].rows[0].map(cell => cell.comment)).toEqual(['Is this right?\nYes.', 'Another thread']);
    expect(viaExcelJs.sheets[0].rows[0].map(cell => cell.comment)).toEqual(['Is this right?\nYes.', 'Another thread']);
    expect(nativeDropped.list()).toEqual(['threadedComments']);
    expect(exceljsDropped.list()).toEqual(['threadedComments']);
  });

  it('treats a <sheetProtection> without sheet="1" as an unprotected sheet on the ExcelJS reader', async() => {
    // ECMA-376 defaults `sheet` to false: `<sheetProtection formatCells="0"/>` (Apache POI writes
    // that shape) records permissions for a sheet nobody protected. Reading it as protected made
    // every cell import read-only.
    const bytes = await writeDirectly((workbook) => {
      const sheet = workbook.addWorksheet('Open');

      sheet.getCell('A1').value = 'x';
      sheet.sheetProtection = { sheet: false, formatCells: true };
    });
    const viaExcelJs = await excelJsAdapter.read(bytes, ExcelJS, new DroppedFeatures());
    const native = await nativeAdapter.read(bytes, undefined, new DroppedFeatures());

    expect(viaExcelJs.sheets[0].protection).toBeNull();
    // The native half of the same rule lands with the worksheet reader's own fix.
    expect(native.sheets[0].protection).toBeNull();
  });

  it('pins the one number-format code the two readers disagree on: ExcelJS strips every backslash escape', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 12.5;
      sheet.cell(1, 1).numFmt = '0.0\\%';
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const numFmtOf = snapshot => snapshot.sheets[0].rows[0][0].numFmt;

    // Finding, asserted with both values rather than normalized: both WRITERS keep the code
    // verbatim, and so does the native reader, but ExcelJS 4.4.0's reader runs
    // `formatCode.replace(/[\\](.)/g, '$1')` on every `<numFmt>` (`numfmt-xform.js`), so a
    // literal percent sign comes back as a scaling one. The raw code is gone from ExcelJS's model
    // by then, and re-escaping cannot know which characters had a backslash.
    expect(numFmtOf(nn)).toBe('0.0\\%');
    expect(numFmtOf(en)).toBe('0.0\\%');
    expect(numFmtOf(ne)).toBe('0.0%');
    expect(numFmtOf(ee)).toBe('0.0%');
  });
});

describe('the LibreOffice attribute dialect: what each reader makes of `"true"`/`"false"`', () => {
  it('reads a LibreOffice sheet protected with a password as protected on both engines', async() => {
    // LibreOffice writes `<sheetProtection algorithmName="SHA-512" hashValue=… sheet="true"/>`.
    // ExcelJS 4.4 leaves `sheet` undefined for `"true"`, but keeps the hash attributes, and a hash
    // exists only on a protected sheet: the ExcelJS engine used to import it unprotected and report
    // no password, while the native engine reported `sheetProtection:password`.
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('P');

    worksheet.getCell('A1').value = 'a';
    await worksheet.protect('', {});

    const bytes = await rewriteArchive(new Uint8Array(await workbook.xlsx.writeBuffer()), (part, text) => (
      part === 'xl/worksheets/sheet1.xml'
        ? text.replace(/<sheetProtection[^>]*\/>/, '<sheetProtection algorithmName="SHA-512" '
          + 'hashValue="aGFzaA==" saltValue="c2FsdA==" spinCount="100000" sheet="true" '
          + 'objects="true" scenarios="true" formatCells="false"/>')
        : text
    ));
    const nativeDropped = new DroppedFeatures();
    const exceljsDropped = new DroppedFeatures();
    const native = (await nativeAdapter.read(bytes, undefined, nativeDropped)).sheets[0];
    const exceljs = (await excelJsAdapter.read(bytes, ExcelJS, exceljsDropped)).sheets[0];

    expect(native.protection).toEqual(expect.objectContaining({ enabled: true, password: null }));
    expect(exceljs.protection).toEqual(expect.objectContaining({ enabled: true, password: null }));
    expect(nativeDropped.list()).toContain('sheetProtection:password');
    expect(exceljsDropped.list()).toContain('sheetProtection:password');
  });

  it('keeps a sheet that carries only permissions (the Apache POI shape) unprotected on both engines', async() => {
    const workbook = new ExcelJS.Workbook();

    workbook.addWorksheet('P').getCell('A1').value = 'a';

    const bytes = await rewriteArchive(new Uint8Array(await workbook.xlsx.writeBuffer()), (part, text) => (
      part === 'xl/worksheets/sheet1.xml'
        ? text.replace('</sheetData>', '</sheetData><sheetProtection formatCells="0"/>')
        : text
    ));
    const native = (await nativeAdapter.read(bytes, undefined, new DroppedFeatures())).sheets[0];
    const exceljs = (await excelJsAdapter.read(bytes, ExcelJS, new DroppedFeatures())).sheets[0];

    expect(native.protection).toBeNull();
    expect(exceljs.protection).toBeNull();
  });

  it('documents that the ExcelJS reader misses LibreOffice\'s protection, RTL, unlock and 1904 flags', async() => {
    // LibreOffice spells every boolean attribute `"true"`/`"false"`. ExcelJS 4.4 maps only `"1"` to
    // true for these, and its model keeps nothing the adapter could recover the flag from: a
    // `sheet="true"` sheet looks exactly like a bare `<sheetProtection/>` (which protects nothing).
    // The native reader reads both spellings. Pinned with both values, the way the number-format
    // divergences are, so a team that injects ExcelJS knows not to read LibreOffice files with it.
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('P');

    worksheet.getCell('A1').value = 'a';
    worksheet.getCell('B2').value = 'e';
    worksheet.getCell('B2').protection = { locked: false };
    worksheet.getCell('C2').value = 45306; // 2024-01-15
    worksheet.getCell('C2').numFmt = 'yyyy-mm-dd';
    await worksheet.protect('', {});

    const bytes = await rewriteArchive(new Uint8Array(await workbook.xlsx.writeBuffer()), (part, text) => {
      if (part === 'xl/worksheets/sheet1.xml') {
        return text
          .replace(/<sheetProtection[^>]*\/>/, '<sheetProtection sheet="true" objects="true" scenarios="true"/>')
          .replace(/<sheetViews>.*?<\/sheetViews>/s, '')
          .replace('<sheetFormatPr',
            '<sheetViews><sheetView rightToLeft="true" workbookViewId="0"/></sheetViews><sheetFormatPr')
          // The same date in the 1904 system, 1462 days lower.
          .replace('<v>45306</v>', '<v>43844</v>');
      }

      if (part === 'xl/workbook.xml') {
        return text.replace(/<workbookPr([^>]*)\/>/, '<workbookPr$1 date1904="true"/>');
      }

      return part === 'xl/styles.xml' ? text.replace('locked="0"', 'locked="false"') : text;
    });
    const native = (await nativeAdapter.read(bytes, undefined, new DroppedFeatures())).sheets[0];
    const exceljs = (await excelJsAdapter.read(bytes, ExcelJS, new DroppedFeatures())).sheets[0];

    expect(native.protection?.enabled).toBe(true);
    expect(native.rtl).toBe(true);
    expect(native.rows[1][1].locked).toBe(false);
    expect(native.rows[1][2].value).toBe(45306);

    expect(exceljs.protection).toBeNull();
    expect(exceljs.rtl).toBe(false);
    expect(exceljs.rows[1][1].locked).toBeNull();
    expect(exceljs.rows[1][2].value).toBe(43844);
  });
});
