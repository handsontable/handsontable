import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const data: (string | number)[][] = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', '', '', '', ''],
  ['Boron', '', '', '', ''],
];

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  data,
  rowHeaders: true,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
  colWidths: [80, 62, 110, 118, 110],
  stretchH: 'all',
  fillHandle: {
    direction: 'vertical',
    autoInsertRow: true,
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
