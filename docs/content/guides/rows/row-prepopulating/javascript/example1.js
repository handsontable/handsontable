import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
const data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13],
];
const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
    data,
    minSpareRows: 1,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    autoWrapRow: true,
    autoWrapCol: true,
});
