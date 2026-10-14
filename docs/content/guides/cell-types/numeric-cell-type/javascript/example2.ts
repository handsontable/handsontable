import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector<HTMLElement>('#example2')!;
const readout = document.querySelector('#example2-readout')!;

const hot = new Handsontable(container, {
  data: [
    ['Stainless Steel Water Bottle', 24.5, 24.5],
    ['Wireless Mouse', 18, 18],
    ['USB-C Charging Cable', 9.9, 9.9],
    ['Desk Lamp', 32, 32],
    ['Notebook A5', 4.75, 4.75],
  ],
  colHeaders: ['Product', 'Default', 'preserveNumericLiteral: true'],
  columns: [
    { type: 'text', readOnly: true, width: 240 },
    { type: 'numeric' },
    { type: 'numeric', preserveNumericLiteral: true },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  afterChange(changes, source) {
    if (source === 'loadData' || !changes) {
      return;
    }

    const [row, prop] = changes[changes.length - 1];
    const column = prop as number;
    const value = hot.getDataAtCell(row, column);
    const label = column === 1 ? 'Default' : 'preserveNumericLiteral';

    readout.textContent = `${label} stores: ${JSON.stringify(value)} (${typeof value})`;
  },
  licenseKey: 'non-commercial-and-evaluation',
});
