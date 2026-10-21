import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle', 142, 24.99, 40, 'In stock', '2026-03-12'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver', 0, 29.5, 25, 'Backorder', '2026-01-08'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland', 67, 349, 20, 'In stock', '2026-04-21'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin', 215, 12.99, 80, 'In stock', '2026-02-17'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Minneapolis', 38, 89, 30, 'Low stock', '2026-05-03'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel', 'Boston', 190, 18.5, 50, 'In stock', '2026-03-29'],
    ['SKU-5088', 'USB-C Hub', 'Harbor Goods', 'Electronics', 'Chicago', 54, 45, 20, 'In stock', '2026-06-11'],
    ['SKU-6120', 'Ceramic Mug Set', 'Alpine Supply Co.', 'Drinkware', 'Phoenix', 88, 32, 24, 'In stock', '2026-04-02'],
    ['SKU-7294', 'Desk Lamp', 'Cascade Distributors', 'Furniture', 'Atlanta', 12, 54.99, 15, 'Low stock', '2026-07-19'],
    ['SKU-8015', 'Laptop Stand', 'Summit Trading', 'Furniture', 'Dallas', 73, 79, 20, 'In stock', '2026-05-28'],
  ],
  height: 200,
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enable the `HiddenColumns` plugin
  // automatically adds the context menu's column hiding items
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true,
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
