import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

// generate an array of arrays with dummy data
const data: string[][] = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example2');
const hot: Handsontable = new Handsontable(container, {
  data,
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedColumnsStart: 2,
  contextMenu: true,
  manualColumnFreeze: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
