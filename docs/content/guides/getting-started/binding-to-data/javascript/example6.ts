import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example6')!;

new Handsontable(container, {
  data: [],
  dataSchema: { id: null, name: { first: null, last: null }, address: null },
  startRows: 5,
  startCols: 4,
  colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
  height: 'auto',
  width: 'auto',
  columns: [{ data: 'id' }, { data: 'name.first' }, { data: 'name.last' }, { data: 'address' }],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
