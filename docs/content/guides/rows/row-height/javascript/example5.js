import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example5');

new Handsontable(container, {
  data: [
    [
      'SKU-4821',
      'Stainless Steel Water Bottle',
      'Harbor Goods',
      'Ships in recyclable packaging. Harbor Goods needs ten days to restock this item, so order early.',
    ],
    [
      'SKU-0093',
      'Wireless Mouse',
      'Alpine Supply Co.',
      'Available in black and silver. The silver version is on backorder until the end of the month.',
    ],
    [
      'SKU-1170',
      'Ergonomic Office Chair',
      'Cascade Distributors',
      'Assembly required. Cascade Distributors includes a hex key and a printed guide in the box.',
    ],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'In stock.'],
  ],
  colHeaders: ['SKU', 'Product', 'Supplier', 'Note'],
  colWidths: [100, 190, 170, 220],
  columns: [
    {},
    {},
    {},
    // show two lines of the note and end the second one with an ellipsis
    { textEllipsis: 2 },
  ],
  width: '100%',
  height: 'auto',
  rowHeaders: true,
  autoRowSize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
