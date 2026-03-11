import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const exportExcel = hot.getPlugin('exportExcel');
const options = {
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileExtension: 'xlsx',
  filename: 'export',
  columnHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: true,
  exportHiddenRows: true,
  range: [1, 1, 6, 6],
  formulas: true,
  sheetName: 'Data',
};

const xlsxText: string = exportExcel.exportAsString();
const xlsxTextWithOptions: string = exportExcel.exportAsString(options);
const blob: Blob = exportExcel.exportAsBlob();
const blobWithOptions: Blob = exportExcel.exportAsBlob(options);

exportExcel.downloadFile();
exportExcel.downloadFile(options);
