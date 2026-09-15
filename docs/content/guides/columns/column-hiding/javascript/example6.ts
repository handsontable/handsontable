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

const container = document.querySelector('#example6')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data,
  height: 200,
  colHeaders: true,
  rowHeaders: true,
  contextMenu: ['hidden_columns_show', 'hidden_columns_hide'],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true,
    // exclude hidden columns from copying and pasting
    copyPasteEnabled: false,
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
