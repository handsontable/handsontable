import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    // add an empty row
    [null],
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      sourceColumn: 0,
      type: 'sum',
      // for this column summary, count row coordinates backward
      reversedRowCoords: true,
      // now, to always display this column summary in the bottom row,
      // set `destinationRow` to `0` (i.e. the last possible row)
      destinationRow: 0,
      destinationColumn: 0,
    },
    {
      sourceColumn: 1,
      type: 'min',
      // for this column summary, count row coordinates backward
      reversedRowCoords: true,
      // now, to always display this column summary in the bottom row,
      // set `destinationRow` to `0` (i.e. the last possible row)
      destinationRow: 0,
      destinationColumn: 1,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
