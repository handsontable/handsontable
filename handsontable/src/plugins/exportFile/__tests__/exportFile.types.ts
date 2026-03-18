import Handsontable from 'handsontable';
import {
  ExportFileSettings,
  SheetOptions,
  ConditionalFormattingDescriptor,
} from 'handsontable/plugins/exportFile';

// Plugin configuration in GridSettings.
new Handsontable(document.createElement('div'), {
  exportFile: {
    engine: {},
    contextMenu: true,
  },
});

// Minimal config — engine only (no contextMenu).
new Handsontable(document.createElement('div'), {
  exportFile: {
    engine: {},
  },
});

// Settings object is assignable to ExportFileSettings.
const settings: ExportFileSettings = { engine: {}, contextMenu: false };

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
  columnHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: true,
  exportHiddenRows: true,
  range: [1, 1, 6, 6],
  sanitizeValues: true,
};

const csvText: string = exportPlugin.exportAsString('csv');
const csvTextWithOptions: string = exportPlugin.exportAsString('csv', csvOptions);

const csvBlob: Blob | Promise<Blob> = exportPlugin.exportAsBlob('csv');
const csvBlobWithOptions: Blob | Promise<Blob> = exportPlugin.exportAsBlob('csv', csvOptions);

exportPlugin.downloadFile('csv');
exportPlugin.downloadFile('csv', csvOptions);

// ─── XLSX — asynchronous ───────────────────────────────────────────────────

const xlsxOptions = {
  filename: 'report',
  columnHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: false,
  exportHiddenRows: false,
  exportFormulas: true,
  compression: true,
  range: [0, 0, 5, 4],
};

const xlsxBlob: Blob | Promise<Blob> = exportPlugin.exportAsBlob('xlsx');
const xlsxBlobWithOptions: Blob | Promise<Blob> = exportPlugin.exportAsBlob('xlsx', xlsxOptions);

const xlsxDownload: void | Promise<void> = exportPlugin.downloadFile('xlsx');
const xlsxDownloadWithOptions: void | Promise<void> = exportPlugin.downloadFile('xlsx', xlsxOptions);

// XLSX export can be awaited.
async function exportAsync(): Promise<void> {
  const blob: Blob = await (exportPlugin.exportAsBlob('xlsx') as Promise<Blob>);
  const _size: number = blob.size;

  await exportPlugin.downloadFile('xlsx', { filename: 'my-report' });
}

// ─── Conditional formatting ────────────────────────────────────────────────

const cf: ConditionalFormattingDescriptor = {
  rows: [0, 4],
  cols: [2, 2],
  rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: [100000] }],
};

const cfMinimal: ConditionalFormattingDescriptor = {
  rules: [],
};

exportPlugin.downloadFile('xlsx', {
  conditionalFormatting: [cf, cfMinimal],
});

// ─── Multi-sheet export ────────────────────────────────────────────────────

const sheet1: SheetOptions = {
  instance: hot,
  name: 'Q1 Sales',
  columnHeaders: true,
  rowHeaders: true,
  exportFormulas: true,
};

const sheet2: SheetOptions = {
  instance: hot2,
  name: 'Q2 Sales',
};

exportPlugin.downloadFile('xlsx', {
  filename: 'annual-report',
  sheets: [sheet1, sheet2],
});

// ─── sanitizeValues variants ───────────────────────────────────────────────

exportPlugin.exportAsString('csv', { sanitizeValues: false });
exportPlugin.exportAsString('csv', { sanitizeValues: /^[+=@-]/ });
exportPlugin.exportAsString('csv', { sanitizeValues: (val: string) => val.replace(/^=/, '') });
