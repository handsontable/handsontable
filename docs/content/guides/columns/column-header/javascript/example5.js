import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example5');
const hot = new Handsontable(container, {
    data: [
        ['Hydrogen', 'H', 1, 1.008],
        ['Helium', 'He', 2, 4.003],
        ['Lithium', 'Li', 3, 6.94],
    ],
    colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)'],
    rowHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
    stretchH: 'all',
    headerClassName: 'htLeft',
    columns: [
        { headerClassName: 'italic-text' },
        { headerClassName: 'bold-text italic-text' },
        { headerClassName: 'htRight bold-text italic-text' },
        {},
    ],
    licenseKey: 'non-commercial-and-evaluation',
});
