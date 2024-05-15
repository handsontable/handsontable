import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example11');
new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [0, 1, 2],
    ['3c', '4b', 5],
    [], []
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      // enable throwing data type errors for this column summary
      suppressDataTypeErrors: false
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // enable throwing data type errors for this column summary
      suppressDataTypeErrors: false
    }
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto'
});
