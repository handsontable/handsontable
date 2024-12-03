import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(50) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example1');

new Handsontable(container, {
  data,
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedColumnsStart: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
