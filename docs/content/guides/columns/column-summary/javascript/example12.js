import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example12');

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [[0.5, 0.5], [0.5, 0.5], [1, 1], [], []],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'average',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
    },
    {
      type: 'average',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // round this column summary result to two digits after the decimal point
      roundFloat: 2,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
