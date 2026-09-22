import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example7')!;

new Handsontable(container, {
  data: [
    ['H', 'Nonmetal', 1],
    ['He', 'Noble gas', 2],
    ['Li', 'Alkali metal', 3],
    ['Be', 'Alkaline earth metal', 4],
    ['B', 'Metalloid', 5],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Symbol', 'Category', 'Atomic Number'],
  rowHeaders: true,
  columns: [
    { width: 90 },
    {},
    { width: 60 },
  ],
  modifyColWidth(width, column) {
    if (column === 1 && width > 120) {
      return 100;
    }
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
