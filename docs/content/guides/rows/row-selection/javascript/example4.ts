import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    { order: 1001, customer: 'Harbor Goods', total: 420, selected: false },
    { order: 1002, customer: 'Alpine Supply Co.', total: 185, selected: true },
    { order: 1003, customer: 'Cascade Distributors', total: 960, selected: false },
    { order: 1004, customer: 'Summit Trading', total: 75, selected: false },
    { order: 1005, customer: 'Nordic Traders', total: 310, selected: true },
    { order: 1006, customer: 'Northgate Wholesale', total: 540, selected: false },
  ],
  columns: [
    { data: 'selected', title: 'Selected', type: 'checkbox' },
    { data: 'order', title: 'Order', readOnly: true },
    { data: 'customer', title: 'Customer' },
    { data: 'total', title: 'Total', type: 'numeric' },
  ],
  colHeaders: true,
  rowHeaders: true,
  // reach the header checkboxes with the arrow keys, toggle them with Space
  navigableHeaders: true,
  height: 'auto',
  // the values of the `selected` column are the row selection
  rowSelection: {
    checkboxLocation: { column: 'selected' },
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
