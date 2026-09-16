import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example7');
new Handsontable(container, {
    data: [
        ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
        ['Helium', 'He', 2, 4.003, 9, -458.0, -452.0],
        ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
    ],
    colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes', 'Melting Point (°F)', 'Boiling Point (°F)'],
    rowHeaders: true,
    colWidths: 100,
    columnHeaderHeight: 50,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
