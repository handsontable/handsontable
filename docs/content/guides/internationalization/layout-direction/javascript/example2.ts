import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Hydrogen', 'H', 1, 1.008, 7],
    ['Helium', 'He', 2, 4.003, 9],
    ['Lithium', 'Li', 3, 6.94, 9],
    ['Beryllium', 'Be', 4, 9.012, 11],
    ['Boron', 'B', 5, 10.81, 15],
  ],
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass', 'Known isotopes'],
  rowHeaders: true,
  height: 'auto',
  // inherit Handsontable's layout direction
  // from the value of your HTML document's `dir` attribute
  layoutDirection: 'inherit',
  autoWrapRow: true,
  autoWrapCol: true,
});
