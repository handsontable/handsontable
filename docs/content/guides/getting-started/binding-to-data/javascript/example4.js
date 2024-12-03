import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example4');
const data = [
  { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
  { id: 2, address: '' },
  { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
];

new Handsontable(container, {
  data,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns(column) {
    switch (column) {
      case 0:
        return { data: 'id' };
      case 1:
        return { data: 'name.first' };
      case 2:
        return { data: 'name.last' };
      case 3:
        return { data: 'address' };
      default:
        return {};
    }
  },
  minSpareRows: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
