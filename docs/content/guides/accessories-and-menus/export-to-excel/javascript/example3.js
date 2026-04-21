import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';

registerAllModules();
new Handsontable(document.querySelector('#example3'), {
  data: [
    ['Laptop Pro 15"',  'Electronics',  1299.99, 38, true ],
    ['Wireless Mouse',  'Accessories',    29.99, 214, true ],
    ['USB-C Hub 7-in-1','Accessories',    49.99, 87, true ],
    ['Monitor 27" 4K',  'Electronics',   449.99, 12, false],
    ['Mech Keyboard',   'Accessories',   119.99, 65, true ],
  ],
  columns: [
    { type: 'text' },
    { type: 'dropdown', source: ['Electronics', 'Accessories', 'Software'] },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    },
    { type: 'numeric' },
    { type: 'checkbox' },
  ],
  colHeaders: ['Product', 'Category', 'Unit Price', 'Stock', 'Active?'],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  contextMenu: true,
  exportFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
});
