import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: true,
  cell: [
    { row: 1, col: 1, comment: { value: 'Some comment' } },
    // add the `style` parameter
    {
      row: 2,
      col: 2,
      comment: {
        value: 'Comment 200x50 px',
        style: { width: 200, height: 50 },
      },
    },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
