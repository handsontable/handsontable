import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', 'Be', 4, 9.012, 11],
  ['Boron', 'B', 5, 10.81, 15],
];

const container = document.querySelector('#example1')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
  minSpareRows: 1,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  autoWrapRow: true,
  autoWrapCol: true,
});
