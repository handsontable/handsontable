import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel'],
  ],
  height: 'auto',
  colHeaders: ['SKU', 'Product', 'Supplier', 'Category'],
  // no row numbers: the checkbox column is the only row header
  rowHeaders: false,
  // reach the header checkbox with the arrow keys, toggle it with Space
  navigableHeaders: true,
  rowSelection: true,
  autoWrapRow: true,
  autoWrapCol: true,
});
