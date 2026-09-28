import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example5');
const hot = new Handsontable(container, {
    data: [
        ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
        ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
        ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
    ],
    colHeaders: true,
    rowHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
    headerClassName: 'htLeft',
    columns: [
        { headerClassName: 'italic-text' },
        { headerClassName: 'bold-text italic-text' },
        { headerClassName: 'htRight bold-text italic-text' },
        {},
    ],
    licenseKey: 'non-commercial-and-evaluation',
});
