import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example4');
const hot = new Handsontable(container, {
    data: [
        ['Hydrogen', 'H', 1, -434.4, 'Gas'],
        ['Helium', 'He', 2, -458.0, 'Gas'],
        ['Lithium', 'Li', 3, 356.9, 'Solid'],
        ['Beryllium', 'Be', 4, 2348.6, 'Solid'],
        ['Boron', 'B', 5, 3768.8, 'Solid'],
    ],
    width: '100%',
    height: 'auto',
    colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Melting Point (°F)', 'State'],
    rowHeaders: true,
    colWidths: [200, 100, 100, 150, 100], // initial width of each column
    manualColumnResize: true,
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});

// Demonstrates ManualColumnResize#clearManualSizes(): drag a column header
// to resize it, then click this button to fall back to `colWidths` again.
const clearSizesButton = document.querySelector('#example4-clearSizes');
clearSizesButton.addEventListener('click', () => {
    hot.getPlugin('manualColumnResize').clearManualSizes();
    hot.render();
});
