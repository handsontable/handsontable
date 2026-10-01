import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  height: 'auto',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Electronics', 'Austin'],
    ['SKU-3341', 'Aluminum Water Filter', 'Drinkware', 'Minneapolis'],
  ],
  colHeaders: ['SKU', 'Product', 'Category', 'Warehouse'],
  columns: [
    {},
    {},
    {
      type: 'dropdown',
      source: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
    },
    {
      type: 'dropdown',
      source: [
        'Seattle',
        'Denver',
        'Portland',
        'Austin',
        'Minneapolis',
        'Boston',
        'Chicago',
        'Phoenix',
        'Atlanta',
        'Dallas',
        'San Jose',
        'Columbus',
      ],
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
