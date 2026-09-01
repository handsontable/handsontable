import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  data: [
    [42000, 31000, 11000],
    [45500, 33200, 12300],
    [48700, 35100, 13600],
    [51200, 36800, 14400],
    [54800, 38900, 15900],
    [57300, 40100, 17200],
  ],
  colHeaders: ['Revenue', 'Expenses', 'Profit'],
  rowHeaders(index) {
    return `Row ${index + 1}`;
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
