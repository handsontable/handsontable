import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Minneapolis'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel', 'Boston'],
    ['SKU-5088', 'USB-C Hub', 'Harbor Goods', 'Electronics', 'Chicago'],
    ['SKU-6120', 'Ceramic Mug Set', 'Alpine Supply Co.', 'Drinkware', 'Phoenix'],
    ['SKU-7294', 'Desk Lamp', 'Cascade Distributors', 'Furniture', 'Atlanta'],
    ['SKU-8015', 'Laptop Stand', 'Summit Trading', 'Furniture', 'Dallas'],
    ['SKU-9166', 'Bluetooth Speaker', 'Northgate Wholesale', 'Electronics', 'San Jose'],
    ['SKU-1042', 'Standing Desk', 'Nordic Traders', 'Furniture', 'Columbus'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enable the `HiddenRows` plugin
  // automatically adds the context menu's row hiding items
  hiddenRows: {
    rows: [3, 5, 9],
    indicators: true,
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
