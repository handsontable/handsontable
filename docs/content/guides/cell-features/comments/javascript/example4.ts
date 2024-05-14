import Handsontable from 'handsontable';
import Core from 'handsontable/core';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example4');
const hot: Core = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Toyota', 'Honda', 'Ford'],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: {
    // on mouseover, wait 2 seconds before the comment box displays
    displayDelay: 2000,
  },
  cell: [
    { row: 1, col: 1, comment: { value: 'Some comment' } },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
});
