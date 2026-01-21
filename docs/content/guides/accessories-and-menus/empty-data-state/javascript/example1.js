import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.getElementById('example1');

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  emptyDataState: true,
  licenseKey: 'non-commercial-and-evaluation',
});
