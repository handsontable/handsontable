// Writes one .xlsx per candidate currency format so the category Excel for Mac assigns can be read
// off the Format Cells dialog (select the cell, ⌘1, look at Category). Run:
//   node .ai/scripts/xlsx-currency-probe.mjs
// Output lands in .ai/scripts/out/.
//
// Machine pre-check (styles.xml):
// | candidate            | numFmtId | formatCode              |
// |-----------------------|----------|--------------------------|
// | a-plain               | 164      | $#,##0.00                |
// | b-lcid                | 164      | [$$-409]#,##0.00         |
// | c-symbol-only         | 164      | [$$]#,##0.00             |
// | d-eur-suffix-lcid     | 164      | #,##0.00\ [$€-40C]       |
// | e-eur-suffix-plain    | 164      | #,##0.00€                |
// Every candidate lands in ExcelJS's first custom slot (numFmtId 164, none reuse a built-in
// currency/accounting id such as 5-8 or 37-44), so the styles.xml alone cannot distinguish
// "Currency" from "Custom" — Excel's Format Cells dialog derives the category by parsing the
// formatCode string itself, which only a human check in Excel can confirm.
// Verdict: awaiting Excel for Mac check (select A1, ⌘1, read Category) — fill per candidate: a=…, b=…, c=…, d=…, e=…
import { mkdirSync, writeFileSync } from 'node:fs';
import ExcelJS from 'exceljs';

const CANDIDATES = {
  'a-plain': '$#,##0.00',                 // what the export writes today (control, shows "Custom")
  'b-lcid': '[$$-409]#,##0.00',           // Excel's own Currency format for en-US
  'c-symbol-only': '[$$]#,##0.00',        // locale-less bracketed symbol
  'd-eur-suffix-lcid': '#,##0.00\\ [$€-40C]', // fr-FR, symbol after the number
  'e-eur-suffix-plain': '#,##0.00€',      // what the export writes today for fr-FR (control)
};

mkdirSync('.ai/scripts/out', { recursive: true });

for (const [name, numFmt] of Object.entries(CANDIDATES)) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Probe');
  const cell = sheet.getCell('A1');

  cell.value = 142000;
  cell.numFmt = numFmt;

  const bytes = await workbook.xlsx.writeBuffer();

  writeFileSync(`.ai/scripts/out/currency-${name}.xlsx`, Buffer.from(bytes));
  console.log(`${name}: ${numFmt}`);
}
