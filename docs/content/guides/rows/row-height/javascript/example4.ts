import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example4')!;

new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
