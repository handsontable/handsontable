import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  minRowHeights: 40,
  manualRowResize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
