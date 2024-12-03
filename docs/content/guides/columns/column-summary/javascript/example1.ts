import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [null]],
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  rowHeaders: true,
  // enable and configure the `ColumnSummary` plugin
  columnSummary: [
    {
      sourceColumn: 0,
      type: 'sum',
      destinationRow: 3,
      destinationColumn: 0,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true,
    },
    {
      sourceColumn: 1,
      type: 'min',
      destinationRow: 3,
      destinationColumn: 1,
    },
    {
      sourceColumn: 2,
      type: 'max',
      destinationRow: 3,
      destinationColumn: 2,
    },
    {
      sourceColumn: 3,
      type: 'count',
      destinationRow: 3,
      destinationColumn: 3,
    },
    {
      sourceColumn: 4,
      type: 'average',
      destinationRow: 3,
      destinationColumn: 4,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
