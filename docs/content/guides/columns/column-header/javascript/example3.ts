import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example3')!;
const columnHeaders = ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes', 'Melting Point (°F)', 'Boiling Point (°F)'];
new Handsontable(container, {
    data: [
        ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
        ['Helium', 'He', 2, 4.003, 9, -458.0, -452.1],
        ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
        ['Beryllium', 'Be', 4, 9.012, 11, 2348.6, 4478.8],
        ['Boron', 'B', 5, 10.81, 11, 3768.8, 7100.6],
    ],
    // Number each header with its column position, something a plain array can't do.
    colHeaders(index: number) {
        return `${index + 1}. ${columnHeaders[index]}`;
    },
    columns: [
        {},
        {},
        { type: 'numeric', numericFormat: { maximumFractionDigits: 0, useGrouping: false } },
        { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
        { type: 'numeric', numericFormat: { maximumFractionDigits: 0, useGrouping: false } },
        { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
        { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
    ],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
