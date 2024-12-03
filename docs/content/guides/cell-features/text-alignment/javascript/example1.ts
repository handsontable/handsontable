import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// generate an array of arrays with dummy data
const data: string[][] = new Array(100) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(18) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data,
  colWidths: 100,
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 },
  ],
  className: 'htCenter',
  cell: [
    { row: 0, col: 0, className: 'htRight' },
    { row: 1, col: 1, className: 'htLeft htMiddle' },
    { row: 3, col: 4, className: 'htLeft htBottom' },
  ],
  afterSetCellMeta(row, col, key, val) {
    console.log('cell meta changed', row, col, key, val);
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
