import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example5')!;

new Handsontable(container, {
  data: [
    ['H', 'Hydrogen', 'Nonmetal'],
    ['He', 'Helium', 'Noble gas'],
    ['Li', 'Lithium', 'Alkali metal'],
    ['Be', 'Beryllium', 'Alkaline earth metal'],
    ['B', 'Boron', 'Metalloid'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Symbol', 'Name', 'Category'],
  rowHeaders: true,
  stretchH: 'all', // 'none' is default
  contextMenu: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
