import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example6');

// Convert "1 234,50" (space or non-breaking space as the thousands separator,
// comma as the decimal separator) to "1234.50".
function toPlainNumbers(text) {
  return text.replace(/(\d)[\u00a0\u202f ](?=\d{3}\b)/g, '$1').replace(/(\d),(\d)/g, '$1.$2');
}

new Handsontable(container, {
  data: [
    ['Wireless mouse', 24.9, 142],
    ['USB-C cable', 9.5, 67],
    ['Mechanical keyboard', 89, 0],
    ['Laptop stand', 45.25, 38],
    ['HDMI adapter', 12.75, 210],
  ],
  colHeaders: ['Product', 'Unit price', 'Stock'],
  columns: [{}, { type: 'numeric', numericFormat: { pattern: '0,0.00' } }, { type: 'numeric' }],
  rowHeaders: true,
  beforePasteParse(clipboardData) {
    clipboardData.setData('text/plain', toPlainNumbers(clipboardData.getData('text/plain')));
    // A spreadsheet also puts a <table> in text/html, and it wins over text/plain.
    clipboardData.clearData('text/html');
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
