import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');

new Handsontable(container, {
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware'],
    ['SKU-0093', 'Wireless Mouse', 'Electronics'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Furniture'],
    ['SKU-2208', 'USB-C Charging Cable', 'Electronics'],
    ['SKU-3341', 'Aluminum Water Filter', 'Drinkware'],
  ],
  colWidths: [90, 210, 110],
  colHeaders: ['SKU', 'Product', 'Category'],
  columns: [
    {},
    {},
    {
      type: 'select',
      selectOptions: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
