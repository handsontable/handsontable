import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example2');
const data = [
    ['Spring Sale 2025', 'Email', '3.4'],
    ['Brand Awareness Q3', 'Paid Search', '8,1'],
    ['Retention Push', 'In-app', '12.0'],
    ['Partner Webinar', 'Organic', '6,75'],
    ['Holiday Preview', 'Social', '9.25'],
];
const decimalValidator = (value, callback) => {
    callback(/^\d+[.,]\d+$/.test(value));
};
new Handsontable(container, {
    data,
    colHeaders: ['Campaign', 'Channel', 'Conversion rate'],
    columns: [
        {},
        {},
        {
            validator: decimalValidator,
            allowInvalid: false,
        },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
