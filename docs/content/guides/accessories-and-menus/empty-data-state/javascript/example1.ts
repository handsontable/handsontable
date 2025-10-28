import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.getElementById('example1') as HTMLElement;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [], // Empty data to trigger empty state
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  emptyDataState: true, // Enable empty data state with default settings
  licenseKey: 'non-commercial-and-evaluation',
});
