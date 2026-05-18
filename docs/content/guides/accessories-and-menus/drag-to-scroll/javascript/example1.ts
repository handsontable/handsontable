import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const container = document.querySelector('#example1') as HTMLElement;

// Build column headers: 'Cost Center' + 49 monthly labels (Jan 2021 … Jan 2025)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colHeaders: string[] = ['Cost Center'];
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
const data: (string | number)[][] = [];

for (let row = 0; row < 50; row++) {
  const rowData: (string | number)[] = [`CC-${1000 + row}`];

  for (let col = 0; col < 49; col++) {
    rowData.push(2000 + row * 100 + col * 50);
  }

  data.push(rowData);
}

new Handsontable(container, {
  data,
  colHeaders,
  width: 500,
  height: 220,
  rowHeaders: true,
  dragToScroll: true,
  licenseKey: 'non-commercial-and-evaluation',
});
