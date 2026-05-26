import Handsontable from 'handsontable';
import {
  ExportFileSettings,
  SheetOptions,
  ConditionalFormattingDescriptor,
} from 'handsontable/plugins/exportFile';

// Plugin configuration in GridSettings.
new Handsontable(document.createElement('div'), {
  exportFile: {
    engines: { xlsx: {} },
  },
});

// Settings object is assignable to ExportFileSettings.
const settings: ExportFileSettings = { engines: { xlsx: {} } };

const hot = new Handsontable(document.createElement('div'), {});
const hot2 = new Handsontable(document.createElement('div'), {});
const exportPlugin = hot.getPlugin('exportFile');

// ─── CSV — synchronous ───────────────────────────────

const csvOptions = {
  mimeType: 'text/csv',
  fileExtension: 'csv',
  filename: 'export.csv',
  encoding: 'utf-8',
  bom: true,
  columnDelimiter: ';',
  rowDelimiter: '\r\n',
  colHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: true,
  exportHiddenRows: true,
  range: [1, 1, 6, 6],
  sanitizeValues: true,
};

const csvText: string = exportPlugin.exportAsString('csv');
const csvTextWithOptions: string = exportPlugin.exportAsString('csv', csvOptions);

const csvBlob: Blob = exportPlugin.exportAsBlob('csv');
const csvBlobWithOptions: Blob = exportPlugin.exportAsBlob('csv', csvOptions);

exportPlugin.downloadFile('csv');
exportPlugin.downloadFile('csv', csvOptions);

// ─── XLSX — asynchronous ───────────────────────────────────────────────────

const xlsxOptions = {
  filename: 'report',
  colHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: false,
  exportHiddenRows: false,
  exportFormulas: true,
  compression: true,
  range: [0, 0, 5, 4],
};

// 'hide' is a valid value for exportHiddenColumns and exportHiddenRows.
exportPlugin.downloadFileAsync('xlsx', { exportHiddenColumns: 'hide', exportHiddenRows: 'hide' });

const csvDownload: void = exportPlugin.downloadFile('csv');
const csvDownloadWithOptions: void = exportPlugin.downloadFile('csv', csvOptions);

// ─── Conditional formatting ────────────────────────────────────────────────

const cf: ConditionalFormattingDescriptor = {
  rows: [0, 4],
  cols: [2, 2],
  rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: [100000] }],
};

const cfMinimal: ConditionalFormattingDescriptor = {
  rules: [],
};

exportPlugin.downloadFileAsync('xlsx', {
  conditionalFormatting: [cf, cfMinimal],
});

// ─── Multi-sheet export ────────────────────────────────────────────────────

const sheet1: SheetOptions = {
  instance: hot,
  name: 'Q1 Sales',
  colHeaders: true,
  rowHeaders: true,
  exportFormulas: true,
  exportHiddenColumns: 'hide',
  exportHiddenRows: 'hide',
};

const sheet2: SheetOptions = {
  instance: hot2,
  name: 'Q2 Sales',
};

exportPlugin.downloadFileAsync('xlsx', {
  filename: 'annual-report',
  sheets: [sheet1, sheet2],
});

// ─── SheetOptions: name is optional ───────────────────────────────────────
// name should be optional — implementation uses `sheetConfig.name || 'Sheet'`
const sheetWithoutName: SheetOptions = {
  instance: hot,
  colHeaders: true,
};

// ─── ExportOptions: headerStyle (XLSX) ────────────────────────────────────
exportPlugin.downloadFileAsync('xlsx', {
  headerStyle: { backgroundColor: '#f2f2f2', border: { style: 'thin' } },
});
exportPlugin.downloadFileAsync('xlsx', { headerStyle: null });

// ─── ExportOptions: engine (per-call override) ────────────────────────────
exportPlugin.downloadFileAsync('xlsx', { engine: {} });
exportPlugin.exportAsBlobAsync('xlsx', { engine: {} });

// ─── sanitizeValues variants ───────────────────────────────────────────────

exportPlugin.exportAsString('csv', { sanitizeValues: false });
exportPlugin.exportAsString('csv', { sanitizeValues: /^[+=@-]/ });
exportPlugin.exportAsString('csv', { sanitizeValues: (val: string) => val.replace(/^=/, '') });

// ─── downloadFileAsync ────────────────────────────────────────────────────

// Basic call — returns Promise<void>.
const asyncDownload: Promise<void> = exportPlugin.downloadFileAsync('xlsx');
const asyncCsvDownload: Promise<void> = exportPlugin.downloadFileAsync('csv');

// With options.
const asyncDownloadWithOpts: Promise<void> = exportPlugin.downloadFileAsync('xlsx', xlsxOptions);

// Can be awaited in an async context.
/**
 *
 */
async function testDownloadFileAsync(): Promise<void> {
  await exportPlugin.downloadFileAsync('xlsx', { filename: 'async-report' });
  await exportPlugin.downloadFileAsync('csv');
}

// ─── supportsExportFormat ─────────────────────────────────────────────────

const supportsXlsx: boolean = exportPlugin.supportsExportFormat('xlsx');
const supportsCsv: boolean = exportPlugin.supportsExportFormat('csv');

// ─── exportAsBlobAsync ────────────────────────────────────────────────────

const asyncCsvBlob: Promise<Blob> = exportPlugin.exportAsBlobAsync('csv');
const asyncXlsxBlob: Promise<Blob> = exportPlugin.exportAsBlobAsync('xlsx');
const asyncBlobWithOpts: Promise<Blob> = exportPlugin.exportAsBlobAsync('xlsx', xlsxOptions);

/**
 *
 */
async function testExportAsBlobAsync(): Promise<void> {
  const blob: Blob = await exportPlugin.exportAsBlobAsync('xlsx');
  const _size: number = blob.size;
}
