import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example6')!;

const hot = new Handsontable(container, {
  data: [
    ['SKU-4821', 'Harbor Goods', 'Electronics', 142],
    ['SKU-0093', 'Alpine Supply Co.', 'Apparel', 67],
    ['SKU-2210', 'Harbor Goods', 'Electronics', 0],
    ['SKU-7734', 'Nordic Traders', 'Home Goods', 58],
    ['SKU-1145', 'Alpine Supply Co.', 'Apparel', 213],
  ],
  colHeaders: ['SKU', 'Supplier', 'Category', 'Quantity'],
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const autoWrapRowCheckbox = document.querySelector<HTMLInputElement>('#auto-wrap-row')!;
const autoWrapColCheckbox = document.querySelector<HTMLInputElement>('#auto-wrap-col')!;

autoWrapRowCheckbox.addEventListener('change', () => {
  hot.updateSettings({ autoWrapRow: autoWrapRowCheckbox.checked });
});

autoWrapColCheckbox.addEventListener('change', () => {
  hot.updateSettings({ autoWrapCol: autoWrapColCheckbox.checked });
});
