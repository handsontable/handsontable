import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;
const hot = new Handsontable(container, {
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors'],
  ],
  colHeaders: true,
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  headerClassName: 'htCenter',
  columns: [{ headerClassName: 'htRight' }, { headerClassName: 'htLeft' }, {}],
  licenseKey: 'non-commercial-and-evaluation',
});
