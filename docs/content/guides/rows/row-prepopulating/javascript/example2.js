import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
registerAllModules();
const templateValues = ['one', 'two', 'three'];
const data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13],
];
function isEmptyRow(instance, row) {
    const rowData = instance.getDataAtRow(row);
    for (let i = 0, ilen = rowData.length; i < ilen; i++) {
        if (rowData[i] !== null) {
            return false;
        }
    }
    return true;
}
const defaultValueRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    if (value === null && isEmptyRow(instance, row)) {
        value = templateValues[col];
        td.style.color = '#999';
    }
    else {
        td.style.color = '';
    }
    textRenderer(instance, td, row, col, prop, value, cellProperties);
};
const container = document.querySelector('#example2');
const hot = new Handsontable(container, {
    data,
    minSpareRows: 1,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    cells() {
        return { renderer: defaultValueRenderer };
    },
    autoWrapRow: true,
    autoWrapCol: true,
});
