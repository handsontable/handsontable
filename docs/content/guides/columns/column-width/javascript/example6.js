import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example6');

new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
    ['A5', 'B5', 'C5', 'D5'],
  ],
  width: '100%',
  height: 'auto',
  colWidths: 80,
  colHeaders: true,
  rowHeaders: true,
  stretchH: 'last',
  contextMenu: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
