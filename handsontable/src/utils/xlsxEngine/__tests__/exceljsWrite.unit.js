/**
 * @jest-environment node
 */
import ExcelJS from 'exceljs';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';

async function writeAndLoad(snapshot) {
  const dropped = new DroppedFeatures();
  const bytes = await excelJsAdapter.write(snapshot, ExcelJS, dropped);
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(bytes);

  return { workbook, dropped };
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
      // `Error`, which used to escape the adapter and abandon the whole export.
      b.merge(2, 2, 2, 2);
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

  it('should write conditional formatting and honor the compression level', async() => {
    const snapshot = snapshotWith((b) => {
      b.cell(1, 1).value = 5;
      b.addConditionalFormatting('A1:A1', [{ type: 'cellIs', operator: 'greaterThan', formulae: [1], style: {} }]);
    });

    snapshot.compression = 9;

    const { workbook } = await writeAndLoad(snapshot);

    expect(workbook.worksheets[0].conditionalFormattings[0].ref).toBe('A1:A1');
  });
});
