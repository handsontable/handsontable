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
import { loadFixture as load, toArrayBuffer } from './helpers/fixtures';
import { normalizeFont, normalizeStyle, strip } from './helpers/snapshotNormalize';

// `strip()` applies the three — and only three — cross-engine normalizations. Their reasons, and
// the rule that no fourth may be added, live at the top of `helpers/snapshotNormalize.js`.

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
 * @param buildFn
 */
async function expectFourWayParity(buildFn) {
  const { nn, ne, en, ee } = await fourWayRead(buildFn);
  const [native, nativeViaExcelJs, exceljsViaNative, exceljs] = [nn, ne, en, ee].map(strip);

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
 * Reduces a snapshot's conditional-formatting blocks to what the two engines can be held to: the
 * `ref`, the resolved rule COUNT, and each rule's `type`/`operator`. Going further would compare
 * ExcelJS's own bookkeeping keys, which is the reason the suite's `strip()` keeps CF at `ref` only.
 * @param snapshot
 */
function cfShape(snapshot) {
  return snapshot.sheets[0].conditionalFormatting.map(block => ({
    ref: block.ref,
    count: block.rules.length,
    rules: block.rules.map(rule => ({ type: rule.type, operator: rule.operator ?? null })),
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

    expect(native).toHaveLength(1);
    expect(native[0].count).toBe(1);
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
    const en = await nativeAdapter.read(toArrayBuffer(exceljsBytes), undefined, new DroppedFeatures());
    const ee = await excelJsAdapter.read(toArrayBuffer(exceljsBytes), ExcelJS, new DroppedFeatures());

    // A block whose every rule was refused is not written at all, so both readers agree there is
    // nothing there in the native-written file.
    expect(cfShape(nn)).toEqual([]);
    expect(cfShape(ne)).toEqual([]);

    // The ExcelJS-written file carries the rule, and both readers see the SAME block — the native
    // reader is not the limitation, the native writer is. `duplicateValues` is the exception:
    // ExcelJS's own writer emits an empty block for it, so both readers report zero rules.
    expect(cfShape(en)).toEqual(cfShape(ee));
    expect(cfShape(en)[0].ref).toBe('A1:A2');
    expect(cfShape(en)[0].count).toBe(kind === 'duplicateValues' ? 0 : 1);
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
  // The two the engines disagree on, pinned with both outcomes rather than skipped.
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
    // Two rows disagree, and both are the ExcelJS side being the lenient one: it TRUNCATES a name
    // over 31 characters with a console warning instead of refusing it, and its reserved-name check
    // is `name === 'History'` exactly, so any other casing passes. The native writer refuses both.
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
