import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data: [
    ['2017', 'Honda', 10],
    ['2018', 'Toyota', 20],
    ['2019', 'Nissan', 30],
  ],
  colWidths: [70, 90, 80],
  colHeaders: ['Year', 'Make', 'In stock'],
  columns: [
    {},
    {
      type: 'select',
      selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda'],
    },
    {},
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
