import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example9');
const output = document.querySelector('#output');

new Handsontable(container, {
  data: [
    ['Wireless mouse', 'Accessories', 24.9, 120],
    ['Mechanical keyboard', 'Accessories', 89, 45],
    ['27-inch monitor', 'Displays', 319.5, 18],
    ['USB-C dock', 'Accessories', 149, 32],
  ],
  colHeaders: ['Product', 'Category', 'Price', 'In stock'],
  rowHeaders: true,
  navigableHeaders: true,
  contextMenu: true,
  editableHeaders: { columnHeaders: true, rowHeaders: true },
  // Save the new names in your app here.
  afterHeaderChange(axis, visualIndex, newValue, oldValue) {
    output.innerText = `Renamed the ${axis} header at index ${visualIndex} from "${oldValue}" to "${newValue}".`;
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
