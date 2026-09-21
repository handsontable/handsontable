// Regenerates the .xlsx fixtures the adapter and mapper tests read. Written with ExcelJS so the
// files are ordinary OOXML any engine can parse. Re-run after changing a case and commit the output.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Writes a workbook to `<name>.xlsx` beside this script.
 *
 * @param {string} name The fixture name, without extension.
 * @param {import('exceljs').Workbook} workbook The workbook to serialize.
 */
async function save(name, workbook) {
  writeFileSync(join(here, `${name}.xlsx`), Buffer.from(await workbook.xlsx.writeBuffer()));
}

// values.xlsx: one row per primitive kind plus a header row, dates and times as serials with formats
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Values');

  ws.getRow(1).values = ['Name', 'Amount', 'Active', 'Hired', 'Start', 'Ratio'];
  ws.getRow(2).values = ['Ana García', 4200.5, true, 45292, 0.5208333333333334, 0.034];
  ws.getRow(3).values = ['James Okafor', 18700, false, 45658, 0.375, 0.081];
  ws.getRow(4).values = ['Li Wei'];
  ws.getCell('B2').numFmt = '#,##0.00';
  ws.getCell('B3').numFmt = '#,##0.00';
  ws.getCell('D2').numFmt = 'mm-dd-yy';
  ws.getCell('D3').numFmt = 'mm-dd-yy';
  ws.getCell('E2').numFmt = 'h:mm:ss';
  ws.getCell('E3').numFmt = 'h:mm:ss';
  ws.getCell('F2').numFmt = '0.0%';
  ws.getCell('F3').numFmt = '0.0%';
  await save('values', wb);
}

// layout.xlsx: widths, heights, hidden row and column, merges, frozen panes, RTL
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Layout');

  for (let r = 1; r <= 5; r++) {
    ws.getRow(r).values = [`R${r}C1`, `R${r}C2`, `R${r}C3`, `R${r}C4`];
  }
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).hidden = true;
  // Column F carries a width and column G a hidden flag, both past the last populated column (D).
  // `worksheet.columnCount` is the widest populated ROW, so it stops at D and a reader keyed on it
  // alone never sees either of these.
  ws.getColumn(6).width = 15;
  ws.getColumn(7).hidden = true;
  ws.getRow(2).height = 30;
  ws.getRow(4).hidden = true;
  ws.mergeCells(1, 1, 1, 2);
  ws.mergeCells(3, 3, 4, 4);
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, rightToLeft: true }];
  await save('layout', wb);
}

// styles.xlsx: font, fill, border, alignment, comment, sheet protection with one unlocked cell
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Styles');

  ws.getCell('A1').value = 'bold red';
  ws.getCell('A1').font = { bold: true, color: { argb: 'FFFF0000' } };
  ws.getCell('B1').value = 'filled';
  ws.getCell('B1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
  ws.getCell('C1').value = 'bordered';
  ws.getCell('C1').border = { top: { style: 'thin', color: { argb: 'FF0000FF' } } };
  ws.getCell('D1').value = 'centered';
  ws.getCell('D1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('E1').value = 'noted';
  ws.getCell('E1').note = 'a comment';
  ws.getCell('A2').value = 'locked';
  ws.getCell('A2').protection = { locked: true };
  ws.getCell('B2').value = 'editable';
  ws.getCell('B2').protection = { locked: false };
  ws.protect('', { selectLockedCells: true, selectUnlockedCells: true });
  await save('styles', wb);
}

// validation.xlsx: inline list, list from a very-hidden helper sheet, plus a non-list validation
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  const helper = wb.addWorksheet('_HotValidation');

  helper.state = 'veryHidden';
  helper.getCell('A1').value = 'Open';
  helper.getCell('A2').value = 'Closed';
  ws.getCell('A1').value = 'Open';
  ws.getCell('A1').dataValidation = { type: 'list', allowBlank: true, formulae: ['\'_HotValidation\'!$A$1:$A$2'] };
  ws.getCell('B1').value = 'b';
  ws.getCell('B1').dataValidation = { type: 'list', allowBlank: true, formulae: ['"a,b,c"'] };
  ws.getCell('C1').value = 5;
  ws.getCell('C1').dataValidation = { type: 'whole', operator: 'between', formulae: [1, 10] };
  await save('validation', wb);
}

// formulas.xlsx: formulas with and without cached results, one conditional formatting block
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Formulas');

  ws.getCell('A1').value = 2;
  ws.getCell('A2').value = 3;
  ws.getCell('A3').value = { formula: 'SUM(A1:A2)', result: 5 };
  ws.getCell('B3').value = { formula: 'A3*2' };
  ws.fillFormula('C1:C2', 'A1*2', [4, 6]);
  ws.addConditionalFormatting({
    ref: 'A1:A3',
    rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: [2], style: { font: { bold: true } } }],
  });
  await save('formulas', wb);
}

// sparse.xlsx: a sheet with a hole row (no `<row>` element at all) and a row that exists only to
// carry a height, so the read has to keep both without materializing the hole.
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sparse');

  ws.getCell('A1').value = 'first';
  ws.getCell('B1').value = 'second';
  // Row 2 is never touched: it is a genuine hole.
  ws.getRow(3).height = 42;
  // Row 3 carries no cell at all, only that height.
  ws.getCell('A4').value = 'last';
  await save('sparse', wb);
}

// lossy.xlsx: the features the neutral model has no room for — a hyperlink, a rich-text run, an
// auto-filter, an embedded image and a table — plus a password-protected sheet.
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Lossy');

  ws.getCell('A1').value = { text: 'Handsontable', hyperlink: 'https://handsontable.com' };
  // A hyperlink whose display text is itself a rich-text run list: the runs sit one level below the
  // cell value, so a reader testing only the top level for `richText` misses them.
  ws.getCell('A2').value = {
    text: { richText: [{ text: 'Hands', font: { bold: true } }, { text: 'ontable docs' }] },
    hyperlink: 'https://handsontable.com/docs',
  };
  ws.getCell('B1').value = {
    richText: [{ text: 'bold', font: { bold: true } }, { text: ' plain' }],
  };
  ws.getCell('A3').value = 'Header';
  ws.getCell('A4').value = 'Row';
  ws.autoFilter = 'A3:A4';
  wb.addImage({
    // A 1×1 transparent GIF, the smallest image any decoder accepts.
    base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    extension: 'gif',
  });
  ws.addImage(0, 'C1:D2');
  ws.addTable({
    name: 'Numbers',
    ref: 'F1',
    columns: [{ name: 'Value' }],
    rows: [[1], [2]],
  });
  await ws.protect('secret', {});
  await save('lossy', wb);
}

// wide-columns.xlsx: 400 rows in ONE column, with a width on column 16384. Excel writes a
// `<col min max width/>` for a sheet-wide width, and ExcelJS's `Column.fromModel` expands it into
// 16384 `Column` objects — so `worksheet.columns.length` is 16384 while `columnCount` is 1. A reader
// that multiplies the row count by the expanded column count refuses this 10 kB file.
{
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Wide');

  for (let r = 1; r <= 400; r++) {
    ws.getCell(r, 1).value = `r${r}`;
  }
  ws.getColumn(16384).width = 12;
  await save('wide-columns', wb);
}

// multi-sheet.xlsx: three sheets with distinct visibility
{
  const wb = new ExcelJS.Workbook();

  wb.addWorksheet('First').getCell('A1').value = 'first';
  const second = wb.addWorksheet('Second');

  second.getCell('A1').value = 'second';
  second.state = 'hidden';
  const third = wb.addWorksheet('Third');

  third.getCell('A1').value = 'third';
  third.state = 'veryHidden';
  await save('multi-sheet', wb);
}
