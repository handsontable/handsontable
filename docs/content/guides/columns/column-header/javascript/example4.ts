import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;
const hot = new Handsontable(container, {
  data: [
    ['Hydrogen', 'H', 1],
    ['Helium', 'He', 2],
    ['Lithium', 'Li', 3],
    ['Beryllium', 'Be', 4],
    ['Boron', 'B', 5],
  ],
  colHeaders: ['Name', 'Symbol', 'Atomic Number'],
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'all',
  headerClassName: 'htCenter',
  columns: [{ headerClassName: 'htRight' }, { headerClassName: 'htLeft' }, {}],
  licenseKey: 'non-commercial-and-evaluation',
});
