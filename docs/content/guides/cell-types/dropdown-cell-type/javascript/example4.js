import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example4');
const departments = [
    'Engineering and Platform Infrastructure',
    'Marketing and Brand Communications',
    'Financial Planning and Analysis',
    'People Operations and Talent Acquisition',
    'Customer Success and Enterprise Accounts',
];
new Handsontable(container, {
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    data: [
        ['Ana García', departments[0], departments[0]],
        ['James Okafor', departments[1], departments[1]],
        ['Li Wei', departments[2], departments[2]],
        ['Sofia Rossi', departments[3], departments[3]],
    ],
    colHeaders: ['Employee', 'Department (default)', 'Department (full width)'],
    columns: [
        {},
        {
            type: 'dropdown',
            source: departments,
            width: 140,
            // trim the list to the cell's width (default)
            trimDropdown: true,
        },
        {
            type: 'dropdown',
            source: departments,
            width: 140,
            // expand the list to fit its longest option
            trimDropdown: false,
        },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
});
