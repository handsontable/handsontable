import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// register all Handsontable's modules
registerAllModules();
const container = document.querySelector('#example2');
new Handsontable(container, {
    data: [
        ['Ana García', 'Engineering', 'Senior Engineer', '2021-04-12'],
        ['James Okafor', 'Marketing', 'Product Manager', '2022-08-30'],
        ['Li Wei', 'Engineering', 'Staff Engineer', '2019-02-18'],
        ['Sofia Rossi', 'Sales', 'Account Executive', '2023-01-09'],
        ['Diego Fernández', 'Design', 'UX Designer', '2020-11-23'],
        ['Amara Singh', 'Engineering', 'Engineering Manager', '2018-06-05'],
    ],
    colHeaders: ['Name', 'Department', 'Title', 'Hire date'],
    rowHeaders: true,
    height: 'auto',
    // show only the column insert and remove items in the context menu
    contextMenu: ['col_left', 'col_right', 'remove_col'],
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
