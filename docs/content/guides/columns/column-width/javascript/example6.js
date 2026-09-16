import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example6');
new Handsontable(container, {
    data: [
        ['H', 'Hydrogen', 1, 'Gas'],
        ['He', 'Helium', 2, 'Gas'],
        ['Li', 'Lithium', 3, 'Solid'],
        ['Be', 'Beryllium', 4, 'Solid'],
        ['B', 'Boron', 5, 'Solid'],
    ],
    width: '100%',
    height: 'auto',
    colWidths: 80,
    colHeaders: ['Symbol', 'Name', 'Atomic Number', 'State'],
    rowHeaders: true,
    stretchH: 'last',
    contextMenu: true,
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
