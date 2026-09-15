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
const container = document.querySelector('#example4');
new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    data,
    height: 200,
    colHeaders: true,
    rowHeaders: true,
    // enable the context menu
    contextMenu: true,
    // enable the `HiddenColumns` plugin
    // automatically adds the context menu's column hiding items
    hiddenColumns: {
        columns: [3, 5, 9],
        indicators: true,
    },
    autoWrapRow: true,
    autoWrapCol: true,
});
