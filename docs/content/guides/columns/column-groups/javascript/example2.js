import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example2');

new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ],
  colHeaders: true,
  rowHeaders: true,
  colWidths: 60,
  height: 'auto',
  nestedHeaders: [
    ['A', { label: 'B', colspan: 8 }, 'C'],
    ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
    [
      'H',
      { label: 'I', colspan: 2 },
      { label: 'J', colspan: 2 },
      { label: 'K', colspan: 2 },
      { label: 'L', colspan: 2 },
      'M',
    ],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
  ],
  collapsibleColumns: [
    { row: -4, col: 1, collapsible: true },
    { row: -3, col: 1, collapsible: true },
    { row: -2, col: 1, collapsible: true },
    { row: -2, col: 3, collapsible: true },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
