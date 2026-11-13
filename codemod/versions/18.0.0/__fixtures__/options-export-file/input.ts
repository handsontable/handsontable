import Handsontable from 'handsontable';

export function exportOrders(hot: Handsontable): void {
  const columnHeaders = true;
  const exportFile = hot.getPlugin('exportFile');

  exportFile.exportAsString('csv', { columnHeaders });
  exportFile.exportAsBlob('csv', { 'columnHeaders': true, bom: false });
  exportFile.downloadFile('csv', { columnHeaders: true, filename: 'orders' });
  exportFile?.downloadFileAsync('xlsx', { sheets: [{ columnHeaders: true }, { colHeaders: true }] });
  exportFile.exportAsString('csv', { columnHeaders: true, colHeaders: false });
  exportFile.exportAsString('csv', { colHeaders: true });
  downloadFile('orders.csv', { columnHeaders: true });
  xlsx.downloadFile({ columnHeaders: ['a', 'b'] });
  console.log({ columnHeaders: true });
}
