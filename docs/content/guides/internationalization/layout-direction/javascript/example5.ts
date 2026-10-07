import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example5')!;

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
  // render Handsontable from the right to the left
  // regardless of your HTML document's `dir`
  layoutDirection: 'rtl',
  columns: [
    {},
    // align this column's text to the left
    { className: 'htLeft' },
    // align this column's text to the center
    { className: 'htCenter' },
    // align this column's text to the right
    { className: 'htRight' },
    {},
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
