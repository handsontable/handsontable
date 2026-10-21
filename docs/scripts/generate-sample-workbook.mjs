/**
 * Builds `public/scripts/xlsx/employees.xlsx`, the workbook the "Import from Excel" guide's demo
 * loads with its **Load sample** button. The file is written by the `ExportFile` plugin itself,
 * running in headless Chromium, so the sample always matches what the built-in engine produces.
 *
 * Run from `docs/`:
 *
 *   npm run docs:generate-sample-workbook            # write the file
 *   npm run docs:generate-sample-workbook -- --verify # write it, then import it back and report
 *
 * Needs `handsontable/dist/handsontable.full.js` (build the core package first) and the Playwright
 * Chromium the docs tests already use.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = path.resolve(docsRoot, '../handsontable/dist/handsontable.full.js');
const outputPath = path.join(docsRoot, 'public/scripts/xlsx/employees.xlsx');
const verify = process.argv.includes('--verify');

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (message) => {
  if (message.type() === 'warning' || message.type() === 'error') {
    console.log(`[browser ${message.type()}] ${message.text()}`);
  }
});

await page.setContent('<!doctype html><html><body><div id="grid"></div><div id="target"></div></body></html>');
await page.addScriptTag({ content: readFileSync(bundlePath, 'utf8') });

const base64 = await page.evaluate(async() => {
  const hot = new window.Handsontable(document.querySelector('#grid'), {
    data: [
      ['Ana García', 'Engineering', 'Senior Engineer', 98000, true, '2022-03-14', 'Leads the grid team.'],
      ['James Okafor', 'Marketing', 'Marketing Manager', 87500, true, '2021-07-01', ''],
      ['Li Wei', 'Engineering', 'Product Manager', 104000, false, '2020-11-23', 'On sabbatical until March.'],
      ['Priya Nair', 'Sales', 'Account Executive', 76200, true, '2023-01-09', ''],
      ['Tom Bakker', 'Support', 'Support Specialist', 58900, true, '2019-05-30', ''],
      ['Sofia Rossi', 'Sales', 'Sales Director', 121000, true, '2018-02-12', 'Owns the EMEA pipeline.'],
      ['Noah Williams', 'Engineering', 'Staff Engineer', 132500, true, '2017-09-04', ''],
      ['Amara Okoye', 'Marketing', 'Content Lead', 72400, false, '2024-05-20', 'Starts in June.'],
      ['Total', '', '', null, '', '', ''],
    ],
    colHeaders: ['Name', 'Department', 'Job title', 'Salary ($)', 'Active', 'Hire date', 'Notes'],
    columns: [
      { type: 'text' },
      { type: 'dropdown', source: ['Engineering', 'Marketing', 'Sales', 'Support'] },
      { type: 'text' },
      { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
      { type: 'checkbox' },
      { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
      { type: 'text' },
    ],
    columnSummary: [
      { sourceColumn: 3, destinationRow: 8, destinationColumn: 3, type: 'sum', forceNumeric: true },
    ],
    mergeCells: [{ row: 8, col: 0, rowspan: 1, colspan: 3 }],
    customBorders: [{ row: 8, col: 3, top: { width: 2, color: '#333333' } }],
    hiddenColumns: { columns: [6] },
    comments: true,
    cell: [
      { row: 0, col: 0, comment: { value: 'Top performer - review for promotion.' } },
      { row: 8, col: 0, className: 'htRight', readOnly: true },
      { row: 8, col: 3, readOnly: true },
    ],
    exportFile: true,
    licenseKey: 'non-commercial-and-evaluation',
  });
  const sheetOptions = { colHeaders: true, exportFormulas: true, exportHiddenColumns: 'hide' };
  const blob = await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', {
    ...sheetOptions,
    sheets: [{ instance: hot, name: 'Employees', ...sheetOptions }],
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
});

const buffer = Buffer.from(base64, 'base64');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, buffer);
console.log(`Wrote ${path.relative(docsRoot, outputPath)} (${buffer.length} bytes)`);

if (verify) {
  const report = await page.evaluate(async(encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const hot = new window.Handsontable(document.querySelector('#target'), {
      data: [['']],
      importFile: true,
      formulas: { engine: window.HyperFormula },
      comments: true,
      mergeCells: true,
      hiddenColumns: true,
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const result = await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', bytes.buffer, {
      colHeaders: 'firstRow',
      importStyles: true,
    });

    return {
      dropped: result.dropped,
      rows: result.data.length,
      colHeaders: result.colHeaders,
      totalFormula: hot.getSourceDataAtCell(8, 3),
      totalValue: hot.getDataAtCell(8, 3),
      mergeCells: result.mergeCells,
      hiddenColumns: result.hiddenColumns,
      comment: hot.getCellMeta(0, 0).comment,
      customBorders: result.customBorders?.length ?? 0,
    };
  }, base64);

  console.log(JSON.stringify(report, null, 2));
}

await browser.close();
