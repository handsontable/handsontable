import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
    ['A6', 'B6', 'C6', 'D6', 'E6'],
    ['A7', 'B7', 'C7', 'D7', 'E7'],
    ['A8', 'B8', 'C8', 'D8', 'E8'],
    ['A9', 'B9', 'C9', 'D9', 'E9'],
    ['A10', 'B10', 'C10', 'D10', 'E10'],
    ['A11', 'B11', 'C11', 'D11', 'E11'],
    ['A12', 'B12', 'C12', 'D12', 'E12'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenRows` plugin
  hiddenRows: {
    // specify rows hidden by default
    rows: [3, 5, 9],
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
