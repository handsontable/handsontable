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

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data,
  height: 200,
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: {
    // specify columns hidden by default
    columns: [3, 5, 9],
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
