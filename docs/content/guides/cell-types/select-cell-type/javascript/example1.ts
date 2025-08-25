import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [
    ['2017', 'Honda', 10],
    ['2018', 'Toyota', 20],
    ['2019', 'Nissan', 30],
  ],
  colWidths: [50, 70, 50],
  colHeaders: true,
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
