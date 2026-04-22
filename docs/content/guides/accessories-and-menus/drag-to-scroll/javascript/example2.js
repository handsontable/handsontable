import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
// Build column headers: 'Cost Center' + 49 monthly labels (Jan 2021 … Jan 2025)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colHeaders = ['Cost Center'];
let year = 2021;
let monthIndex = 0;
while (colHeaders.length < 50) {
    colHeaders.push(`${months[monthIndex]} ${year}`);
    monthIndex += 1;
    if (monthIndex >= months.length) {
        monthIndex = 0;
        year += 1;
    }
}
// Build 50 rows of budget data
const data = [];
for (let row = 0; row < 50; row++) {
    const rowData = [`CC-${1000 + row}`];
    for (let col = 0; col < 49; col++) {
        rowData.push(2000 + row * 100 + col * 50);
    }
    data.push(rowData);
}
// Root layout
const root = document.querySelector('#example2');
root.innerHTML = `
  <div id="dts-sliders" style="display:flex;gap:28px;flex-wrap:wrap;margin-bottom:16px;
       font:13px/1.4 sans-serif;color:#334155;"></div>
  <div id="dts-hot"></div>
`;
function addSlider(label, unit, min, max, step, initialValue, onChange) {
    const wrapper = document.createElement('label');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    const nameLabel = document.createElement('b');
    nameLabel.style.fontFamily = 'monospace';
    nameLabel.textContent = `${label}: ${initialValue} ${unit}`;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initialValue);
    input.style.cssText = 'width:200px;cursor:pointer;';
    input.addEventListener('input', () => {
        nameLabel.textContent = `${label}: ${input.value} ${unit}`;
        onChange(Number(input.value));
    });
    wrapper.append(nameLabel, input);
    document.getElementById('dts-sliders').appendChild(wrapper);
}
let intervalMin = 20;
let intervalMax = 500;
let rampDistance = 120;
const hot = new Handsontable(document.getElementById('dts-hot'), {
    data,
    colHeaders,
    width: 500,
    height: 220,
    rowHeaders: true,
    dragToScroll: {
        interval: { min: intervalMin, max: intervalMax },
        rampDistance,
    },
    licenseKey: 'non-commercial-and-evaluation',
});
function sync() {
    hot.updateSettings({
        dragToScroll: {
            interval: { min: intervalMin, max: intervalMax },
            rampDistance,
        },
    });
}
addSlider('interval.min', 'ms', 10, 200, 10, intervalMin, (value) => {
    intervalMin = value;
    sync();
});
addSlider('interval.max', 'ms', 100, 1000, 50, intervalMax, (value) => {
    intervalMax = value;
    sync();
});
addSlider('rampDistance', 'px', 20, 300, 10, rampDistance, (value) => {
    rampDistance = value;
    sync();
});
