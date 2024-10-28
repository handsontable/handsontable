import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const exportFile = hot.getPlugin('exportFile');
const options = {
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
};

const csvText: string = exportFile.exportAsString('csv');
const csvTextWithOptions: string = exportFile.exportAsString('csv', options);
const blob: Blob = exportFile.exportAsBlob('csv');
const blobWithOptions: Blob = exportFile.exportAsBlob('csv', options);

exportFile.downloadFile('csv');
exportFile.downloadFile('csv', options);
