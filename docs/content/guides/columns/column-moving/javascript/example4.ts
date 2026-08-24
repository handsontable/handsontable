import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  ['SKU-4821', 'Wireless keyboard', 'Harbor Goods', 142],
  ['SKU-0093', 'USB-C dock', 'Vertex Supply', 67],
  ['SKU-3148', '27-inch monitor', 'Alpine Supply Co.', 24],
  ['SKU-7720', 'Laptop stand', 'Northstar Wholesale', 89],
  ['SKU-1056', 'Noise-canceling headset', 'Summit Distribution', 35],
];

const container = document.querySelector('#example4')!;
const allowColumnMovingInput = document.querySelector<HTMLInputElement>('#allow-column-moving')!;
let allowColumnMoving = false;

allowColumnMovingInput.addEventListener('change', () => {
  allowColumnMoving = allowColumnMovingInput.checked;
});

new Handsontable(container, {
  data,
  colHeaders: ['SKU', 'Product', 'Supplier', 'Stock'],
  rowHeaders: true,
  manualColumnMove: true,
  beforeColumnMove: () => allowColumnMoving,
  stretchH: 'all',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
