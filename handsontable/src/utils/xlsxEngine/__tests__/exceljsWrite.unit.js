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

async function writeAndLoad(snapshot) {
  const dropped = new DroppedFeatures();
  const bytes = await excelJsAdapter.write(snapshot, ExcelJS, dropped);
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(bytes);

  return { workbook, dropped };
}

async function sheetXmlOf(bytes) {
  return (await readZip(toArrayBuffer(bytes))).text('xl/worksheets/sheet1.xml');
}

function snapshotWith(buildFn) {
  const snapshot = createWorkbookSnapshot();
  const builder = new SheetBuilder('Sheet1');

  buildFn(builder);
  snapshot.sheets.push(builder.toSnapshot());

  return snapshot;
}

describe('excelJsAdapter.write', () => {
  it('should write primitive values, number formats and formulas', async() => {
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'text';
      b.cell(1, 2).value = 42;
      b.cell(1, 3).value = true;
      b.cell(2, 1).value = 45292;
      b.cell(2, 1).numFmt = 'mm-dd-yy';
      b.cell(2, 2).formula = { text: 'SUM(B1:B1)' };
      b.cell(2, 3).formula = { text: 'B1*2', result: 84 };
    });
    const { workbook, dropped } = await writeAndLoad(snapshot);
    const ws = workbook.worksheets[0];

    expect(ws.getCell('A1').value).toBe('text');
    expect(ws.getCell('B1').value).toBe(42);
    expect(ws.getCell('C1').value).toBe(true);
    expect(ws.getCell('A2').numFmt).toBe('mm-dd-yy');
    expect(ws.getCell('B2').value.formula).toBe('SUM(B1:B1)');
    expect(ws.getCell('C2').value).toEqual({ formula: 'B1*2', result: 84 });
    expect(dropped.list()).toEqual([]);
  });

  it('should write styles, validation, comments and per-cell protection', async() => {
    const snapshot = snapshotWith((b) => {
      const cell = b.cell(1, 1);

      cell.value = 'styled';
      cell.style = {
        alignment: { horizontal: 'center' },
        font: { bold: true, color: { argb: 'FFFF0000' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } },
        border: { top: { style: 'thin', color: { argb: 'FF0000FF' } } },
      };
      cell.validation = { type: 'list', allowBlank: true, formulae: ['"a,b,c"'] };
      cell.comment = 'note';
      cell.locked = false;
      b.protect('', { sort: true });
    });
    const { workbook } = await writeAndLoad(snapshot);
    const cell = workbook.worksheets[0].getCell('A1');

    expect(cell.alignment.horizontal).toBe('center');
    expect(cell.font.bold).toBe(true);
    expect(cell.font.color.argb).toBe('FFFF0000');
    expect(cell.fill.fgColor.argb).toBe('FF00FF00');
    expect(cell.border.top.style).toBe('thin');
    expect(cell.dataValidation.formulae).toEqual(['"a,b,c"']);
    expect(cell.note).toBe('note');
    expect(cell.protection.locked).toBe(false);
    expect(workbook.worksheets[0].sheetProtection).toBeDefined();
  });

  it('should write layout: widths, heights, hidden, merges, freeze, rtl, state', async() => {
    const snapshot = snapshotWith((b) => {
      b.cell(3, 3).value = 'x';
      b.setColWidth(1, 5);
      b.setColWidth(2, 12.5);
      b.hideCol(2);
      b.setRowHeight(2, 30);
      b.hideRow(3);
      b.merge(1, 1, 1, 2);
      b.freeze(1, 2);
      b.setRtl(true);
    });
    const hiddenSheet = new SheetBuilder('_HotValidation');

    hiddenSheet.cell(1, 1).value = 'a';
    hiddenSheet.setState('veryHidden');
    snapshot.sheets.push(hiddenSheet.toSnapshot());

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

  it('should write the rows before merging, so a merged range keeps its master value', async() => {
    // ExcelJS forwards a merged slave cell's `value` assignment to its master, so merging before
    // the rows are written makes the last written cell of the range overwrite the master's value.
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'A1 label';
      b.cell(1, 2).value = null;
      b.merge(1, 1, 1, 2);
    });
    const { workbook } = await writeAndLoad(snapshot);
    const ws = workbook.worksheets[0];

    expect(ws.getCell('A1').value).toBe('A1 label');
    expect(ws.model.merges).toEqual(['A1:B1']);
  });

  it('should skip an overlapping merge and report it instead of throwing', async() => {
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'A1';
      b.cell(2, 2).value = 'B2';
      b.merge(1, 1, 2, 2);
      // Overlaps the range above. ExcelJS answers `Cannot merge already merged cells` with a bare
      // `Error`, which used to escape the adapter and abandon the whole export. (A single-cell
      // range would not test this: both writers skip one before it reaches the overlap check.)
      b.merge(2, 2, 3, 3);
    });
    const { workbook, dropped } = await writeAndLoad(snapshot);

    expect(dropped.list()).toEqual(['merge:overlap']);
    expect(workbook.worksheets[0].model.merges).toEqual(['A1:B2']);
    expect(workbook.worksheets[0].getCell('A1').value).toBe('A1');
  });

  it('should name Handsontable as the workbook author and ask for a full recalculation on load', async() => {
    const created = [];
    const recordingModule = {
      Workbook: class RecordingWorkbook extends ExcelJS.Workbook {
        constructor() {
          super();
          created.push(this);
        }
      },
      ValueType: ExcelJS.ValueType,
    };
    const withFormula = snapshotWith((b) => {
      b.cell(1, 1).value = 2;
      b.cell(1, 2).formula = { text: 'A1*2' };
    });
    const withoutFormula = snapshotWith((b) => {
      b.cell(1, 1).value = 2;
    });

    await excelJsAdapter.write(withFormula, recordingModule, new DroppedFeatures());
    await excelJsAdapter.write(withoutFormula, recordingModule, new DroppedFeatures());

    // ExcelJS's `calcPr` parser records the element but never reads `fullCalcOnLoad` back, so the
    // flag is asserted on the workbook it serialized rather than on one loaded from the bytes.
    expect(created[0].calcProperties.fullCalcOnLoad).toBe(true);
    // A workbook with no formula must not ask for a recalculation it has nothing to recalculate.
    expect(created[1].calcProperties.fullCalcOnLoad).toBeUndefined();

    const { workbook } = await writeAndLoad(withFormula);

    expect(workbook.creator).toBe('Handsontable');
    expect(workbook.lastModifiedBy).toBe('Handsontable');
  });

  it('should actually store the entries uncompressed when compression is off', async() => {
    const build = (compression) => {
      const snapshot = snapshotWith((b) => {
        for (let row = 1; row <= 200; row++) {
          for (let col = 1; col <= 10; col++) {
            b.cell(row, col).value = 'the same repeated string in every single cell';
          }
        }
      });

      snapshot.compression = compression;

      return excelJsAdapter.write(snapshot, ExcelJS, new DroppedFeatures());
    };
    const stored = await build(false);
    const deflated = await build(6);

    // `compression: false` used to pass no `zip` options at all, which left JSZip on its own
    // DEFLATE default — so the option could not be turned off, and both sizes were equal.
    expect(stored.byteLength).toBeGreaterThan(deflated.byteLength);
  });

  it('should keep a covered merge cell\'s own lock, and copy the master\'s style onto unstyled covered cells', async() => {
    // `mergeCells` copies the master's style over the covered cells, protection included, so an
    // unlocked covered cell was written locked. A merge whose covered cells carry nothing of their
    // own still takes the copy, which is how a merged header's border reaches its covered edge.
    const thin = { style: 'thin' };
    const border = { top: thin, left: thin, bottom: thin, right: thin };
    const { workbook } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 'own lock';
      b.cell(1, 2).locked = false;
      b.merge(1, 1, 1, 2);
      b.cell(2, 1).value = 'header';
      b.cell(2, 1).style = {
        alignment: null, font: null, fill: null, border,
      };
      b.merge(2, 1, 2, 2);
    }));
    const ws = workbook.worksheets[0];

    expect(ws.getCell('B1').protection).toEqual(expect.objectContaining({ locked: false }));
    expect(ws.getCell('B2').border).toEqual(border);
  });

  it('should give a formatted covered cell the master border and fill, and keep its own number format', async() => {
    // A covered cell of a `numeric` column carries a number format and an alignment, so the merge
    // went through `mergeCellsWithoutStyle` and the master's box border stopped at that cell:
    // LibreOffice drew the block without its right edge.
    const thin = { style: 'thin' };
    const border = { top: thin, left: thin, bottom: thin, right: thin };
    const fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    const { workbook } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 'master';
      b.cell(1, 1).style = { alignment: null, font: null, fill, border };
      b.cell(1, 2).numFmt = '0.00';
      b.cell(1, 2).style = { alignment: { horizontal: 'right' }, font: null, fill: null, border: null };
      b.merge(1, 1, 1, 3);
    }));
    const ws = workbook.worksheets[0];

    expect(ws.getCell('B1').border).toEqual(border);
    expect(ws.getCell('B1').fill).toEqual(fill);
    expect(ws.getCell('B1').numFmt).toBe('0.00');
    expect(ws.getCell('B1').alignment).toEqual({ horizontal: 'right' });
    expect(ws.getCell('C1').border).toEqual(border);
  });

  it('should keep the number format of a covered cell that has nothing else, and give it the master border', async() => {
    // A covered cell of a `date` column carries a number format and no style, no lock.
    const thin = { style: 'thin' };
    const border = { top: thin, left: thin, bottom: thin, right: thin };
    const { workbook } = await writeAndLoad(snapshotWith((b) => {
      b.cell(1, 1).value = 'master';
      b.cell(1, 1).numFmt = '0.000';
      b.cell(1, 1).style = { alignment: null, font: null, fill: null, border };
      b.cell(1, 2).numFmt = 'yyyy-mm-dd';
      b.merge(1, 1, 1, 3);
    }));
    const ws = workbook.worksheets[0];

    expect(ws.getCell('B1').numFmt).toBe('yyyy-mm-dd');
    expect(ws.getCell('B1').border).toEqual(border);
  });

  it.each([
    ['a vertical merge', [2, 1, 3, 1]],
    ['a horizontal merge', [2, 1, 2, 2]],
  ])('should write the empty master of %s, so the next cell keeps its column', async(_, merge) => {
    // ExcelJS skips a cell with no value and no style, and Apple's parser (Quick Look, Numbers) then
    // places the cells after the missing master one column early.
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 'a1';
      b.cell(1, 2).value = 'b1';
      b.cell(1, 3).value = 'c1';
      b.cell(2, 2).value = 'b2';
      b.cell(2, 3).value = 'c2';
      b.cell(3, 1).value = 'a3';
      b.cell(3, 2).value = 'b3';
      b.merge(...merge);
    });
    const bytes = await excelJsAdapter.write(snapshot, ExcelJS, new DroppedFeatures());

    expect(await sheetXmlOf(bytes)).toMatch(/<row r="2"[^>]*><c r="A2"/);

    // The empty alignment that makes ExcelJS write the master changes nothing a reader shows: the
    // native reader reads no cell there, and ExcelJS's reader an empty one carrying only the
    // workbook's default font and an empty fill, neither of which the import turns into a style.
    const exceljsRead = await excelJsAdapter.read(toArrayBuffer(bytes), ExcelJS, new DroppedFeatures());
    const nativeRead = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());
    const exceljsMaster = exceljsRead.sheets[0].rows[1][0];

    expect(nativeRead.sheets[0].rows[1][0]).toBeNull();
    expect(exceljsMaster.value).toBeNull();
    expect(exceljsMaster.formula).toBeNull();
    expect(exceljsMaster.style.alignment).toBeNull();
    expect(exceljsMaster.style.border).toBeNull();
    expect(exceljsMaster.style.fill).toEqual({ type: 'pattern', pattern: 'none' });
  });

  it('should write a timePeriod rule with no formula on both engines, with the formula ExcelJS documents', async() => {
    // ExcelJS's README documents `{ type, priority, timePeriod, style }`, and 18.1 wrote it with the
    // formula ExcelJS builds itself. The native writer builds the same one.
    const build = () => snapshotWith((b) => {
      b.cell(1, 1).value = 1;
      b.addConditionalFormatting('B2:C3', [
        { type: 'timePeriod', timePeriod: 'today', style: { font: { bold: true } } },
        { type: 'timePeriod', timePeriod: 'lastMonth', style: { font: { italic: true } } },
      ]);
    });
    const exceljsDropped = new DroppedFeatures();
    const nativeDropped = new DroppedFeatures();
    const exceljsXml = await sheetXmlOf(await excelJsAdapter.write(build(), ExcelJS, exceljsDropped));
    const nativeXml = await sheetXmlOf(await nativeAdapter.write(build(), undefined, nativeDropped));
    const rulePattern = /<cfRule type="timePeriod"[^>]*timePeriod="(\w+)"[^>]*><formula>([^<]*)<\/formula>/g;
    const formulas = xml => [...xml.matchAll(rulePattern)]
      .map(([, period, formula]) => [period, formula]);

    expect(exceljsDropped.list()).toEqual([]);
    expect(nativeDropped.list()).toEqual([]);
    expect(formulas(exceljsXml)).toEqual([
      ['today', 'FLOOR(B2,1)=TODAY()'],
      ['lastMonth', 'AND(MONTH(B2)=MONTH(EDATE(TODAY(),0-1)),YEAR(B2)=YEAR(EDATE(TODAY(),0-1)))'],
    ]);
    expect(formulas(nativeXml)).toEqual(formulas(exceljsXml));
  });

  it('should drop the malformed conditional formatting rules the native writer drops, under the same names', async() => {
    // Unscreened, ExcelJS threw a TypeError for each of these but two: an `expression` with an
    // empty `formulae` was written with an empty `<formula/>`, and a `timePeriod` with a formula and
    // no period without its `timePeriod` attribute. The native writer reports every one of them.
    const blocks = [
      [[{ type: 42 }, 'x', null], 'conditionalFormatting:invalid'],
      [[{ type: 'expression', style: { font: { bold: true } } }], 'conditionalFormatting:expression'],
      [[{ type: 'expression', formulae: [], style: { font: { bold: true } } }], 'conditionalFormatting:expression'],
      [[{ type: 'timePeriod', formulae: ['TODAY()'], style: {} }], 'conditionalFormatting:timePeriod'],
      // A period `ST_TimePeriod` does not list has no formula to build.
      [[{ type: 'timePeriod', timePeriod: 'nextYear', style: {} }], 'conditionalFormatting:timePeriod'],
      // The bare rule the native reader used to import for these kinds: ExcelJS threw on `cfvo.forEach`.
      [[{ type: 'colorScale', priority: 1 }], 'conditionalFormatting:colorScale'],
      [[{ type: 'colorScale', cfvo: [{ type: 'min' }, { type: 'max' }] }], 'conditionalFormatting:colorScale'],
      [[{ type: 'dataBar', priority: 1 }], 'conditionalFormatting:dataBar'],
      [[{ type: 'iconSet', priority: 1 }], 'conditionalFormatting:iconSet'],
    ];

    for (const [rules, name] of blocks) {
      const build = () => snapshotWith((b) => {
        b.cell(1, 1).value = 5;
        b.addConditionalFormatting('A1:A2', rules);
        b.addConditionalFormatting('A1:A2', [{ type: 'cellIs', operator: 'greaterThan', formulae: [1], style: {} }]);
      });
      // eslint-disable-next-line no-await-in-loop -- one engine pair per block, so a failure names it.
      const { workbook, dropped } = await writeAndLoad(build());
      const nativeDropped = new DroppedFeatures();

      // eslint-disable-next-line no-await-in-loop
      await nativeAdapter.write(build(), undefined, nativeDropped);

      expect([name, dropped.list()]).toEqual([name, [name]]);
      expect([name, nativeDropped.list()]).toEqual([name, [name]]);
      expect(workbook.worksheets[0].conditionalFormattings.map(cf => cf.rules.map(rule => rule.type)))
        .toEqual([['cellIs']]);
    }
  });

  it('should write conditional formatting and honor the compression level', async() => {
    // The level is not observable in the bytes of a one-cell workbook (levels 1 and 9 can deflate
    // it identically), so the options ExcelJS's `writeBuffer` receives are recorded instead, on a
    // workbook whose `xlsx` writer passes every call through to the real one.
    const writeOptions = [];
    const recordingModule = {
      Workbook: class RecordingWorkbook extends ExcelJS.Workbook {
        constructor() {
          super();

          const { xlsx } = this;
          const writeBuffer = xlsx.writeBuffer.bind(xlsx);

          xlsx.writeBuffer = (options) => {
            writeOptions.push(options);

            return writeBuffer(options);
          };
        }
      },
      ValueType: ExcelJS.ValueType,
    };
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 5;
      b.addConditionalFormatting('A1:A1', [{ type: 'cellIs', operator: 'greaterThan', formulae: [1], style: {} }]);
    });

    snapshot.compression = 9;

    const bytes = await excelJsAdapter.write(snapshot, recordingModule, new DroppedFeatures());
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(bytes);

    expect(writeOptions).toEqual([{ zip: { compression: 'DEFLATE', compressionOptions: { level: 9 } } }]);
    expect(workbook.worksheets[0].conditionalFormattings[0].ref).toBe('A1:A1');
  });
});
