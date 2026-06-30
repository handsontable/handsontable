import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// register Handsontable's modules
registerAllModules();
const container = document.querySelector('#example1');
// apply a custom class and inline style to the container element
container.classList.add('inventory-grid');
container.style.border = '1px solid #4caf50';
const data = [
    ['SKU-4821', 'Wireless Mouse', 142, 'Electronics'],
    ['SKU-0093', 'USB-C Cable', 67, 'Electronics'],
    ['SKU-1175', 'Desk Lamp', 0, 'Home Office'],
    ['SKU-3340', 'Notebook', 230, 'Stationery'],
    ['SKU-7782', 'Standing Desk', 18, 'Furniture'],
];
new Handsontable(container, {
    data,
    colHeaders: ['SKU', 'Product', 'Stock', 'Category'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
