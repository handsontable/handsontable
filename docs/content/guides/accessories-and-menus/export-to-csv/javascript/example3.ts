import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { ExportFile } from 'handsontable/plugins';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;

const hot = new Handsontable(container, {
  data: [
    ['https://api.acme-inventory.com/live-stock', '=WEBSERVICE("https://api.acme-inventory.com/live-stock")'],
    ['https://status.vertex-logistics.com/feed', '=WEBSERVICE("https://status.vertex-logistics.com/feed")'],
    ['http://malicious.example/payload.exe', '=CMD("| calc.exe")'],
    ['https://news.example.com/q2-briefing', '=HYPERLINK("http://malicious.example","Open report")'],
    ['https://cdn.example.com/daily.csv', '+SUM(1,1)'],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const exportPlugin: ExportFile = hot.getPlugin('exportFile');

document.querySelector('#no-sanitization')!.addEventListener('click', () => {
  exportPlugin.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
  });
});

document.querySelector('#recommended-sanitization')!.addEventListener('click', () => {
  exportPlugin.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    sanitizeValues: true,
  });
});

document.querySelector('#regexp-sanitization')!.addEventListener('click', () => {
  exportPlugin.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    sanitizeValues: /WEBSERVICE|CMD|HYPERLINK|^\+/,
  });
});

document.querySelector('#function-sanitization')!.addEventListener('click', () => {
  exportPlugin.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    sanitizeValues: (value) => {
      return /WEBSERVICE|CMD|HYPERLINK|^\+/.test(value) ? 'REMOVED SUSPICIOUS CELL CONTENT' : value;
    },
  });
});
