import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// register all Handsontable's modules
registerAllModules();
const container = document.querySelector('#example1');
const insertButton = document.querySelector('#insert-column');
const removeButton = document.querySelector('#remove-column');
const hot = new Handsontable(container, {
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
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
insertButton.addEventListener('click', () => {
    // insert one column at the end of the grid
    hot.alter('insert_col_end', hot.countCols() - 1, 1);
});
removeButton.addEventListener('click', () => {
    // remove the last column, but keep at least one column in the grid
    if (hot.countCols() > 1) {
        hot.alter('remove_col', hot.countCols() - 1, 1);
    }
});
