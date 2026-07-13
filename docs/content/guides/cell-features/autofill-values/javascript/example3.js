import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13],
    ['2020', '', '', '', ''],
    ['2021', '', '', '', ''],
];
const container = document.querySelector('#example3');
const output = document.querySelector('#output');
new Handsontable(container, {
    data,
    rowHeaders: true,
    colHeaders: true,
    fillHandle: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
    beforeAutofill(selectionData) {
        // This dealership reports sales in batches of 5 cars, so round every
        // filled value up to the nearest multiple of 5.
        return selectionData.map((row) => row.map((value) => (typeof value === 'number' ? Math.ceil(value / 5) * 5 : value)));
    },
    afterAutofill(fillData, sourceRange, targetRange, direction) {
        output.innerText =
            `Filled rows ${targetRange.from.row}-${targetRange.to.row}, ` +
                `columns ${targetRange.from.col}-${targetRange.to.col} (direction: "${direction}").`;
    },
});
