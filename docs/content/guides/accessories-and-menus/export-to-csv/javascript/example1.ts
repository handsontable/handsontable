import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { ExportFile } from 'handsontable/plugins';

const container = document.querySelector('#example1')!;

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'],
  ],
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: { rows: [1, 3, 5], indicators: true },
  hiddenColumns: { columns: [1, 3, 5], indicators: true },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const exportPlugin: ExportFile = hot.getPlugin('exportFile');

const button = document.querySelector('#export-file')!;

button.addEventListener('click', () => {
  exportPlugin.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    columnHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    rowHeaders: true,
  });
});
