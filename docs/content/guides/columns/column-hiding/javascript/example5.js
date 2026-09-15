import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
// generate an array of arrays with dummy data
const data = new Array(10) // number of rows
    .fill(null)
    .map((_, row) => new Array(10) // number of columns
    .fill(null)
    .map((_, column) => `${row}, ${column}`));
const container = document.querySelector('#example5');
new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    data,
    height: 200,
    colHeaders: true,
    rowHeaders: true,
    // individually add column hiding context menu items
    contextMenu: ['hidden_columns_show', 'hidden_columns_hide'],
    hiddenColumns: {
        columns: [3, 5, 9],
        indicators: true,
    },
    autoWrapRow: true,
    autoWrapCol: true,
});
