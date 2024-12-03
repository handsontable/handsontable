import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example4');

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
  // render Handsontable from the left to the right
  // regardless of your HTML document's `dir`
  layoutDirection: 'ltr',
  autoWrapRow: true,
  autoWrapCol: true,
});
