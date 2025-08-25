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
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
  ],
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  dropdownMenu: ['remove_col', '---------', 'make_read_only', '---------', 'alignment'],
  autoWrapRow: true,
  autoWrapCol: true,
});
