import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  licenseKey: 'non-commercial-and-evaluation',
  data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 12.345], [11, 12, 13, null, 15], [null]],
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  rowHeaders: true,
  // enable and configure the `ColumnSummary` plugin
  columnSummary: [
    {
      sourceColumn: 0,
      type: 'sum',
      destinationRow: 3,
      destinationColumn: 0,
      forceNumeric: true,
    },
    {
      sourceColumn: 1,
      type: 'min',
      destinationRow: 3,
      destinationColumn: 1,
      forceNumeric: true,
    },
    {
      sourceColumn: 2,
      type: 'max',
      destinationRow: 3,
      destinationColumn: 2,
      forceNumeric: true,
    },
    {
      sourceColumn: 3,
      type: 'count',
      destinationRow: 3,
      destinationColumn: 3,
      forceNumeric: true,
    },
    {
      sourceColumn: 4,
      type: 'average',
      roundFloat: 'auto',
      destinationRow: 3,
      destinationColumn: 4,
      forceNumeric: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
