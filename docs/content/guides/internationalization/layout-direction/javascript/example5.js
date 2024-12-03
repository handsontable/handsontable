import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example5');

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  // render Handsontable from the right to the left
  // regardless of your HTML document's `dir`
  layoutDirection: 'rtl',
  columns: [
    {},
    // align this column's text to the left
    { className: 'htLeft' },
    // align this column's text to the center
    { className: 'htCenter' },
    // align this column's text to the right
    { className: 'htRight' },
    {},
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
