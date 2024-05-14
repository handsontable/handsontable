import Handsontable from 'handsontable';
import Core from 'handsontable/core';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');
const hot: Core = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ],
  colHeaders: ['One', 'Two', 'Three'],
  rowHeaders: true,
  manualColumnMove: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
