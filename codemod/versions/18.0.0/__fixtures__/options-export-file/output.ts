import Handsontable from 'handsontable';

export function exportOrders(hot: Handsontable): void {
  const columnHeaders = true;
  const exportFile = hot.getPlugin('exportFile');

  exportFile.exportAsString('csv', { colHeaders: columnHeaders });
  exportFile.exportAsBlob('csv', { 'colHeaders': true, bom: false });
  exportFile.downloadFile('csv', { colHeaders: true, filename: 'orders' });
  exportFile?.downloadFileAsync('xlsx', { sheets: [{ colHeaders: true }, { colHeaders: true }] });
  // TODO(handsontable-codemod 18.0.0/export-column-headers): Remove columnHeaders by hand: both columnHeaders and colHeaders are set in this object.
  exportFile.exportAsString('csv', { columnHeaders: true, colHeaders: false });
  exportFile.exportAsString('csv', { colHeaders: true });
  downloadFile('orders.csv', { columnHeaders: true });
  // TODO(handsontable-codemod 18.0.0/export-column-headers): Rename columnHeaders to colHeaders if this is the exportFile plugin: it could not be confirmed...
  xlsx.downloadFile({ columnHeaders: ['a', 'b'] });
  console.log({ columnHeaders: true });
}
