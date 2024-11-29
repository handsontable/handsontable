import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// generate an array of arrays with dummy data
const data: string[][] = new Array(50) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(500) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  data,
  height: 320,
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  mergeCells: {
    virtualized: true,
    cells: [{ row: 1, col: 1, rowspan: 3, colspan: 498 }],
  },
  viewportColumnRenderingOffset: 15,
  viewportColumnRenderingThreshold: 5,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
