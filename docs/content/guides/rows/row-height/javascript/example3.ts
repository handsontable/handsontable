import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3')!;

new Handsontable(container!, {
  themeName: 'ht-theme-main',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights(index) {
    return (index + 1) * 20;
  },
  manualRowResize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
