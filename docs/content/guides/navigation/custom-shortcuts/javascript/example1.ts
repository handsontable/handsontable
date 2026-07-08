import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data: (string | number)[][] = [
  ['SKU-4821', 'Wireless Mouse', 128, 'Electronics'],
  ['SKU-0093', 'Desk Lamp', 42, 'Home Goods'],
  ['SKU-7734', 'USB-C Cable', 310, 'Electronics'],
  ['SKU-2210', 'Notebook Set', 87, 'Office Supplies'],
  ['SKU-5567', 'Water Bottle', 156, 'Outdoor'],
];

const container: Element = document.querySelector('#example1')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['SKU', 'Product', 'Quantity', 'Category'],
  columns: [{}, {}, { type: 'numeric' }, {}],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

// get the `grid` context from the `ShortcutManager` API
const gridContext = hot.getShortcutManager().getContext('grid');

// register a custom keyboard shortcut in the `grid` context:
// pressing Control/Meta+Enter inserts a new row below the selected cell
gridContext.addShortcut({
  keys: [['control/meta', 'enter']],
  group: 'insertRowBelow',
  callback: () => {
    const selected = hot.getSelectedRangeLast();

    if (!selected) {
      return;
    }

    hot.alter('insert_row_below', selected.highlight.row);
  },
});
