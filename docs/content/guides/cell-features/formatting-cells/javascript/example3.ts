import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  data: [
    ['SKU-4821', 'Laptop Pro 15', 'Electronics', 149900, 42],
    ['SKU-0093', 'Wireless Mouse', 'Peripherals', 2999, 218],
    ['SKU-7712', 'USB-C Hub 7-port', 'Peripherals', 5499, 0],
    ['SKU-3305', 'Mech. Keyboard', 'Peripherals', 8999, 67],
    ['SKU-9140', '4K Monitor 27"', 'Electronics', 34999, 15],
  ],
  rowHeaders: true,
  colHeaders: ['SKU', 'Product', 'Category', 'Price ($)', 'Stock'],
  autoWrapRow: true,
  autoWrapCol: true,
  stretchH: 'all',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  customBorders: [
    {
      range: {
        from: {
          row: 1,
          col: 1,
        },
        to: {
          row: 3,
          col: 4,
        },
      },
      top: {
        width: 2,
        color: '#5292F7',
        style: 'dotted',
      },
      bottom: {
        width: 2,
        color: 'red',
      },
      start: {
        width: 2,
        color: 'orange',
        style: 'dashed',
      },
      end: {
        width: 2,
        color: 'magenta',
      },
    },
    {
      row: 2,
      col: 2,
      start: {
        width: 2,
        color: 'red',
      },
      end: {
        width: 1,
        color: 'green',
      },
    },
  ],
});
