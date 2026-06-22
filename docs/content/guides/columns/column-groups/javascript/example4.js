import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example4');
new Handsontable(container, {
    data: [
        ['$4.2M', '$3.8M', '$4.5M', '$4.1M', '$4.7M', '$5.2M'],
        ['$3.1M', '$2.9M', '$3.4M', '$3.6M', '$3.8M', '$4.0M'],
        ['$5.6M', '$5.9M', '$6.3M', '$6.1M', '$6.8M', '$7.2M'],
        ['$1.4M', '$1.6M', '$1.5M', '$1.7M', '$1.9M', '$2.1M'],
        ['$2.2M', '$2.0M', '$2.4M', '$2.5M', '$2.7M', '$2.9M'],
    ],
    colHeaders: true,
    rowHeaders: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'],
    height: 'auto',
    manualColumnMove: true,
    nestedHeaders: [
        // Q1 2025 is cohesive (the default); Q2 2025 opts into splitting.
        [
            { label: 'Q1 2025', colspan: 3 },
            { label: 'Q2 2025', colspan: 3, splittable: true },
        ],
        ['January', 'February', 'March', 'April', 'May', 'June'],
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
