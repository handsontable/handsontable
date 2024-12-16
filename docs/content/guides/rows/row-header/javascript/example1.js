import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Generate an array of arrays with a dummy data
const generateData = (rows = 3, columns = 7, additionalRows = true) => {
  let counter = 0;
  const array2d = [...new Array(rows)].map((_) =>
    [...new Array(columns)].map((_) => counter++)
  );

  if (additionalRows) {
    array2d.push([]);
    array2d.push([]);
  }

  return array2d;
};

const container = document.querySelector('#example1');

new Handsontable(container, {
  data: generateData(),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  contextMenu: true,
  manualRowMove: true,
  bindRowsWithHeaders: 'strict',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
