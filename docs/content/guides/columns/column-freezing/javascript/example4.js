import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// units sold per SKU and month, with the yearly total in the last column
const skus = Array.from({ length: 60 }, (_, row) => months.map((_, month) => 120 + ((row * 37 + month * 53) % 380)));
const sum = (values) => values.reduce((total, value) => total + value, 0);
const monthTotals = months.map((_, month) => sum(skus.map((units) => units[month])));
const data = [
  ['Target', ...months.map(() => 18000), 216000],
  ...skus.map((units, row) => [`SKU-${4000 + row}`, ...units, sum(units)]),
  ['Total', ...monthTotals, sum(monthTotals)],
];

const container = document.querySelector('#example4');

new Handsontable(container, {
  data,
  colHeaders: ['SKU', ...months, 'Total'],
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  fixedColumnsStart: 1,
  fixedColumnsEnd: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
