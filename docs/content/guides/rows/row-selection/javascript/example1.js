import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const output = document.querySelector('#example1-output');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Active'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Active'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Discontinued'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Active'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Active'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel', 'Discontinued'],
    ['SKU-5088', 'USB-C Hub', 'Harbor Goods', 'Electronics', 'Active'],
    ['SKU-6120', 'Ceramic Mug Set', 'Alpine Supply Co.', 'Drinkware', 'Active'],
    ['SKU-7294', 'Desk Lamp', 'Cascade Distributors', 'Furniture', 'Active'],
    ['SKU-8015', 'Laptop Stand', 'Summit Trading', 'Furniture', 'Active'],
  ],
  height: 'auto',
  colHeaders: ['SKU', 'Product', 'Supplier', 'Category', 'Status'],
  rowHeaders: true,
  // reach the header checkboxes with the arrow keys, toggle them with Space
  navigableHeaders: true,
  filters: true,
  dropdownMenu: true,
  // enable the `RowSelection` plugin
  rowSelection: {
    // "select all" acts on the rows that pass the filters
    selectAll: 'filtered',
    // discontinued products can't be selected
    isRowSelectable: (rowData) => rowData[4] !== 'Discontinued',
  },
  autoWrapRow: true,
  autoWrapCol: true,
  afterRowSelectionChange() {
    const selected = hot.getPlugin('rowSelection').getSelectedRowsData();

    output.innerText = `Selected products: ${selected.map((row) => row[0]).join(', ') || 'none'}`;
  },
});
