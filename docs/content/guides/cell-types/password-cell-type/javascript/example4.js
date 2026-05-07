import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example4');
new Handsontable(container, {
    data: [
        { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
        { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
        { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' },
    ],
    colHeaders: ['ID', 'First name', 'Last name', 'Password'],
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'password', type: 'password', hashRevealDelay: 1000 },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
});
