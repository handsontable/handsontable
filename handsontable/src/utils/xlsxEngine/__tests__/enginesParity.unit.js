/**
 * @jest-environment node
 *
 * Proves the native and ExcelJS xlsx engines agree with each other, not merely with themselves.
 * `nativeRead.unit.js` already diffs six unstyled fixtures read by both adapters; this file closes
 * the gaps the parity-matrix audit named: the styled/validation/lossy fixtures on the READ side, and
 * every writer on the WRITE side (nothing compared the two writers before this file existed).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';

/**
 * Reads a fixture file into the `ArrayBuffer` an adapter's `read()` expects.
 * @param name
 */
function load(name) {
  const bytes = readFileSync(join(__dirname, 'fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Rounds a number to nine decimal places.
 *
 * Legitimate difference #1: the ExcelJS adapter reads a time-formatted cell as a `Date` and
 * converts it back into a serial on the way out, which loses a few ulps in the last place
 * (`0.5208333333333334` round-trips as `0.52083333333212`). The native adapter never routes a
 * value through `Date`, so without this the two would disagree on float noise, never on content.
 * @param value
 */
function roundNumber(value) {
  return typeof value === 'number' ? Math.round(value * 1e9) / 1e9 : value;
}

/**
 * Collapses a font object to `null` unless it carries a property the model actually tracks (bold,
 * italic, underline, or an explicit argb color).
 *
 * Legitimate difference #3 (font half): ExcelJS's `cell.font` getter resolves a cell's *default*
 * font (theme, size, family) into a full object merely because the cell carries a style index at
 * all, while the native reader correctly reports no style for the same cell. Without this, any
 * fixture cell whose only xf difference from the base is unrelated to font would still disagree.
 * @param font
 */
function normalizeFont(font) {
  if (!font) {
    return null;
  }

  const { bold, italic, underline, color } = font;
  const argb = color && typeof color.argb === 'string' ? color : undefined;

  return bold || italic || underline || argb ? { bold, italic, underline, color: argb } : null;
}

/**
 * Collapses a fill object to `null` unless it is a solid pattern carrying a foreground color.
 *
 * Legitimate difference #3 (fill half): the same reasoning as `normalizeFont` — ExcelJS resolves a
 * cell's default fill into an object even when nothing meaningful was set.
 * @param fill
 */
function normalizeFill(fill) {
  return fill && fill.pattern === 'solid' && fill.fgColor ? fill : null;
}

/**
 * Applies `normalizeFont`/`normalizeFill` to a cell style. Alignment and border are passed through
 * UNNORMALIZED on purpose: a previous review confirmed the existing normalizations leave those two
 * exposed, and that property must survive here too, or a real alignment/border divergence would be
 * silently hidden rather than caught.
 * @param style
 */
function normalizeStyle(style) {
  if (!style) {
    return null;
  }

  const font = normalizeFont(style.font);
  const fill = normalizeFill(style.fill);
  const { alignment = null, border = null } = style;

  return font || fill || alignment || border ? { alignment, font, fill, border } : null;
}

/**
 * `JSON.stringify`'s replacer for one snapshot: every number is rounded, every cell style is
 * normalized, everything else is passed through as-is.
 * @param key
 * @param value
 */
function normalizeValue(key, value) {
  return key === 'style' ? normalizeStyle(value) : roundNumber(value);
}

/**
 * Normalizes a whole workbook snapshot for cross-engine comparison.
 *
 * Legitimate difference #2: a sheet's conditional-formatting blocks are reduced to their `ref`
 * only. ExcelJS's own rule objects carry its own bookkeeping keys that have no equivalent in the
 * native reader's output, so comparing full rule content would fail on that bookkeeping rather than
 * on anything the two engines actually disagree about.
 * @param snapshot
 */
function strip(snapshot) {
  return JSON.parse(JSON.stringify(
    snapshot.sheets.map(sheet => ({
      ...sheet, conditionalFormatting: sheet.conditionalFormatting.map(cf => cf.ref),
    })),
    normalizeValue,
  ));
}

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
 * Converts a `Uint8Array` (what both adapters' `write()` returns) into the `ArrayBuffer` slice
 * both adapters' `read()` expects.
 * @param bytes
 */
function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
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
 * @param buildFn
 */
async function expectFourWayParity(buildFn) {
  const { nn, ne, en, ee } = await fourWayRead(buildFn);
  const [native, nativeViaExcelJs, exceljsViaNative, exceljs] = [nn, ne, en, ee].map(strip);

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
    });
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
    });
  });

  it('writes a cell comment the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'x';
      sheet.cell(1, 1).comment = 'a note';
      snapshot.sheets.push(sheet.toSnapshot());
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
    });
  });

  it('writes column widths, row heights, and hidden rows and columns the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      sheet.cell(1, 2).value = 'b';
      sheet.cell(2, 1).value = 'hidden row';
      sheet.setColWidth(1, 8);
      sheet.setColWidth(2, 20);
      sheet.hideCol(2);
      sheet.setRowHeight(1, 25);
      sheet.hideRow(2);
      snapshot.sheets.push(sheet.toSnapshot());
    });
  });

  it('writes frozen panes, right-to-left, and a veryHidden sheet the same way', async() => {
    await expectFourWayParity((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 'a';
      sheet.freeze(1, 1);
      sheet.setRtl(true);
      snapshot.sheets.push(sheet.toSnapshot());

      const hidden = new SheetBuilder('Hidden');

      hidden.cell(1, 1).value = 'x';
      hidden.setState('veryHidden');
      snapshot.sheets.push(hidden.toSnapshot());
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
      sheet.protect('', { formatColumns: true, sort: true, autoFilter: true });
      snapshot.sheets.push(sheet.toSnapshot());
    });

    [nn, ne, en, ee].forEach((snapshot) => {
      const row = snapshot.sheets[0].rows[0];

      expect(row[0].locked).toBe(false);
      expect(row[1].locked).toBeNull();
      expect(snapshot.sheets[0].protection.enabled).toBe(true);
      expect(snapshot.sheets[0].protection.password).toBeNull();
      expect(snapshot.sheets[0].protection.options).toEqual(expect.objectContaining({
        formatColumns: true, sort: true, autoFilter: true,
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
    // "padded to sheet width" contract. The native reader used to derive the width from the `<c>`
    // elements it saw alone, so its own round trip (`nn`) came back one cell short — the native
    // writer emits no `<c>` for an unstyled covered cell. The reader now materializes every merge
    // member, exactly as ExcelJS does.
    [nn, ne, en, ee].forEach((snapshot) => {
      expect(snapshot.sheets[0].rows[0][0].value).toBe('master');
      expect(snapshot.sheets[0].merges).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
      expect(snapshot.sheets[0].rows[0]).toHaveLength(2);
      expect(snapshot.sheets[0].rows[0][1]).toBeNull();
    });
  });

  it('documents that native\'s built-in numFmt id 22 differs from ExcelJs\'s canonical string for the same id', async() => {
    const { nn, ne, en, ee } = await fourWayRead((snapshot) => {
      const sheet = new SheetBuilder('Sheet1');

      sheet.cell(1, 1).value = 45292.5;
      sheet.cell(1, 1).numFmt = 'm/d/yy h:mm'; // native's ECMA-376 string for built-in id 22
      snapshot.sheets.push(sheet.toSnapshot());
    });
    const numFmtOf = snapshot => snapshot.sheets[0].rows[0][0].numFmt;

    // Finding, and one the parity-matrix audit already named as a known gap: a numFmtId of 22 with
    // no explicit `<numFmts>` override means "whatever this engine's own built-in table says id 22
    // is." Native's table (`BUILT_IN_NUM_FMTS`, ECMA-376) says `m/d/yy h:mm`; ExcelJS's own reader
    // disagrees by a literal quoted `"h"`. Both engines preserve the exact string whenever THEY
    // wrote the file (`nn`, `en`, `ee` all agree with what was asked for); only reading a
    // NATIVE-written file with the ExcelJS reader (`ne`) surfaces ExcelJS's own canonical string
    // instead. Asserted explicitly, per this file's rule against normalizing a real divergence away.
    expect(numFmtOf(nn)).toBe('m/d/yy h:mm');
    expect(numFmtOf(en)).toBe('m/d/yy h:mm');
    expect(numFmtOf(ee)).toBe('m/d/yy h:mm');
    expect(numFmtOf(ne)).toBe('m/d/yy "h":mm');
  });
});
