import Handsontable from 'handsontable';

const container = document.getElementById('example1');

new Handsontable(container, {
  data: [],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  emptyDataState: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
