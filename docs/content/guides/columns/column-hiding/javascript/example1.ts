import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

// generate an array of arrays with dummy data
const data: string[][] = new Array(10) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(10) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data,
  height: 200,
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: {
    columns: [2, 4, 6],
    indicators: true,
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
