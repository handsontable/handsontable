import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors'],
  ],
  colHeaders: true,
  rowHeaders: true,
  manualColumnMove: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
