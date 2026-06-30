import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example7');
new Handsontable(container, {
    data: [
        ['SKU-4821', 'Bolt', 142],
        ['SKU-0093', 'Stainless steel mounting bracket', 67],
        ['SKU-1147', 'Washer', 210],
        ['SKU-2205', 'Hex nut assortment pack', 38],
        ['SKU-3310', 'Cable tie', 95],
    ],
    width: '100%',
    height: 'auto',
    colHeaders: ['SKU', 'Product', 'Stock'],
    rowHeaders: true,
    colWidths: [90, undefined, 60],
    modifyColWidth(width, column) {
        if (column === 1 && width > 150) {
            return 100;
        }
    },
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
