import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example2');

new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Toyota', 'Honda', 'Ford'],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: true,
  cell: [
    {
      row: 0,
      col: 1,
      comment: { value: 'A read-only comment.', readOnly: true },
    },
    { row: 0, col: 3, comment: { value: 'You can edit this comment' } },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
