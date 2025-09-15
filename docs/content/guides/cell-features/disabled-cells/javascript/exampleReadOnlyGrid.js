import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#exampleReadOnlyGrid');

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
  ],
  height: 'auto',
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  // make the entire grid read-only
  readOnly: true,
  autoWrapRow: true,
  autoWrapCol: true,
});
