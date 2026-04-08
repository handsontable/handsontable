import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example5');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6'],
  ],
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

document.querySelector('#select-cell').addEventListener('click', () => {
  // Select a single cell: row 1, col 1 (B2)
  hot.selectCell(1, 1);
});
document.querySelector('#select-range').addEventListener('click', () => {
  // Select a range: row 1, col 1 to row 3, col 3 (B2:D4)
  hot.selectCell(1, 1, 3, 3);
});
document.querySelector('#deselect').addEventListener('click', () => {
  hot.deselectCell();
});
