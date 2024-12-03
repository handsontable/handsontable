import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example5');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
  ],
  colHeaders: true,
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  headerClassName: 'htLeft',
  columns: [
    { headerClassName: 'italic-text' },
    { headerClassName: 'bold-text italic-text' },
    { headerClassName: 'htRight bold-text italic-text' },
    {},
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
