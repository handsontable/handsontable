import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    ['Product', 'Price', 'Tax', '=B2*C2'],
    ['Keyboard', 120, 0.23, '=B3*C3'],
    ['Mouse', 60, 0.23, '=B4*C4'],
  ],
  colHeaders: ['Name', 'Net', 'VAT', 'VAT value'],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const exportPlugin = hot.getPlugin('exportExcel');
const button = document.querySelector('#export-file');

button.addEventListener('click', () => {
  exportPlugin.downloadFile({
    filename: 'Handsontable-XLSX-file_[YYYY]-[MM]-[DD]',
    columnHeaders: true,
    rowHeaders: true,
    formulas: true,
  });
});
