import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example4')!;
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ],
  colHeaders: true,
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  headerClassName: 'htCenter',
  columns: [{ headerClassName: 'htRight' }, { headerClassName: 'htLeft' }, {}],
  licenseKey: 'non-commercial-and-evaluation',
});
