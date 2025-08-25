import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ],
  colHeaders: true,
  rowHeaders: true,
  manualColumnMove: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
