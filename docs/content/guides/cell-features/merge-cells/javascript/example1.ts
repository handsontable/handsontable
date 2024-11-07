import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// generate an array of arrays with dummy data
const data: string[][] = new Array(100) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(50) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data,
  height: 320,
  colWidths: 50,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 },
    { row: 5, col: 6, rowspan: 3, colspan: 3 },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
