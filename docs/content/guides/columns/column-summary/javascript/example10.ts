import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example10')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [[0, 1, 2], ['3c', '4b', 5], [], []],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true,
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
