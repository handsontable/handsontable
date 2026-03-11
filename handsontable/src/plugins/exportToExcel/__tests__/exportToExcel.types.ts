import Handsontable from 'handsontable';

const container = document.createElement('div');
const hot = new Handsontable(container, {});

const plugin: Handsontable.plugins.ExportToExcel = hot.getPlugin('exportToExcel');

plugin.downloadFile();
plugin.downloadFile({ filename: 'test' });
plugin.downloadFile({
  filename: 'Report',
  sheetName: 'Data',
  columnHeaders: true,
  rowHeaders: true,
  exportHiddenRows: false,
  exportHiddenColumns: false,
  range: [0, 0, 10, 5],
});

const blob: Blob = plugin.exportAsBlob();
const blobWithOptions: Blob = plugin.exportAsBlob({ columnHeaders: true });

const bytes: Uint8Array = plugin.exportAsUint8Array();
const bytesWithOptions: Uint8Array = plugin.exportAsUint8Array({ sheetName: 'MySheet' });
