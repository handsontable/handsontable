import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const UNIT_SIZES = {
    px: { width: '600px', height: '300px' },
    '%': { width: '75%', height: '75%' },
    em: { width: '37.5em', height: '18.75em' },
    rem: { width: '37.5rem', height: '18.75rem' },
    vh: { width: '50vh', height: '50vh' },
    vw: { width: '50vw', height: '50vw' },
};
const UNIT_CAPTIONS = {
    px: 'A fixed pixel size, independent of any parent element or font size.',
    '%': "A percentage of the parent container's size (the dashed box).",
    em: "A multiple of this element's own font size.",
    rem: "A multiple of the document's root font size.",
    vh: "A percentage of the browser viewport's height.",
    vw: "A percentage of the browser viewport's width.",
};
const container = document.querySelector('#example2');
const unitSelect = document.querySelector('#unitSelect');
const unitCaption = document.querySelector('#unitCaption');
const hot = new Handsontable(container, {
    data: [
        ['SKU-4821', 'Wireless Mouse', 'Electronics', 'Harbor Goods', 142],
        ['SKU-0093', 'Canvas Tote Bag', 'Apparel', 'Alpine Supply Co.', 67],
        ['SKU-2210', 'USB-C Hub', 'Electronics', 'Harbor Goods', 0],
        ['SKU-7734', 'Ceramic Mug Set', 'Home Goods', 'Nordic Traders', 58],
        ['SKU-1145', 'Wool Scarf', 'Apparel', 'Alpine Supply Co.', 213],
        ['SKU-3399', 'Bluetooth Speaker', 'Electronics', 'Harbor Goods', 84],
        ['SKU-5567', 'Cotton T-Shirt', 'Apparel', 'Alpine Supply Co.', 310],
        ['SKU-8842', 'Desk Lamp', 'Home Goods', 'Nordic Traders', 45],
        ['SKU-6621', 'Laptop Stand', 'Electronics', 'Harbor Goods', 29],
        ['SKU-4470', 'Throw Blanket', 'Home Goods', 'Nordic Traders', 76],
        ['SKU-9983', 'Leather Wallet', 'Apparel', 'Alpine Supply Co.', 132],
        ['SKU-2287', 'Wireless Charger', 'Electronics', 'Harbor Goods', 97],
    ],
    colHeaders: ['SKU', 'Product', 'Category', 'Supplier', 'Quantity'],
    rowHeaders: true,
    width: UNIT_SIZES.px.width,
    height: UNIT_SIZES.px.height,
    licenseKey: 'non-commercial-and-evaluation',
});
unitCaption.textContent = UNIT_CAPTIONS.px;
unitSelect.addEventListener('change', () => {
    const unit = UNIT_SIZES[unitSelect.value];
    hot.updateSettings({ width: unit.width, height: unit.height });
    unitCaption.textContent = UNIT_CAPTIONS[unitSelect.value];
});
