import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2');

new Handsontable(container, {
  data: [
    ['Hydrogen', 'H', 1, 1.008, 7],
    ['Helium', 'He', 2, 4.003, 9],
    ['Lithium', 'Li', 3, 6.94, 9],
    ['Beryllium', 'Be', 4, 9.012, 11],
    ['Boron', 'B', 5, 10.81, 15],
  ],
  rowHeaders: true,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass', 'Known isotopes'],
  contextMenu: true,
  comments: true,
  cell: [
    {
      row: 0,
      col: 0,
      comment: { value: 'A read-only comment.', readOnly: true },
    },
    { row: 1, col: 0, comment: { value: 'You can edit this comment' } },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
