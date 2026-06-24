import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { sku: 'SKU-4821', supplier: 'Harbor Goods', stock: 142, category: 'Electronics' },
  { sku: 'SKU-0093', supplier: 'Alpine Supply Co.', stock: 0, category: 'Apparel' },
  { sku: 'SKU-7311', supplier: 'Meadow Foods', stock: 67, category: 'Grocery' },
  { sku: 'SKU-2250', supplier: 'Harbor Goods', stock: 318, category: 'Electronics' },
  { sku: 'SKU-9047', supplier: 'Northwind Traders', stock: 12, category: 'Hardware' },
  { sku: 'SKU-6638', supplier: 'Alpine Supply Co.', stock: 205, category: 'Apparel' },
];
/* end:skip-in-preview */

// `columns` and `colHeaders` are kept in mutable variables so the custom menu
// item can extend them and push the change back through `updateSettings`.
const columns = [
  { data: 'sku', width: 120 },
  { data: 'supplier', width: 170 },
  { data: 'stock', width: 90 },
  { data: 'category', width: 130 },
];
const colHeaders = ['SKU', 'Supplier', 'Stock', 'Category'];

let newColumnCount = 0;

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data,
  rowHeaders: true,
  colHeaders,
  columns,
  height: 'auto',
  width: '100%',
  contextMenu: {
    items: {
      // Object data blocks the built-in `col_left` / `col_right` items, so a
      // custom action does the work instead.
      add_column: {
        name: 'Add column',
        callback(key, selection) {
          const insertAt = selection[0].start.col + 1;

          newColumnCount += 1;
          const newKey = `custom_${newColumnCount}`;

          // 1. Add the new property to every source row object.
          hot.getSourceData().forEach((row) => {
            row[newKey] = '';
          });

          // 2. Extend the `columns` and `colHeaders` arrays at the clicked position.
          columns.splice(insertAt, 0, { data: newKey, width: 130, className: 'ht-new-column' });
          colHeaders.splice(insertAt, 0, `Custom ${newColumnCount}`);

          // 3. Apply the new structure.
          hot.updateSettings({ columns, colHeaders });
        },
      },
      sep1: '-',
      row_above: { name: 'Insert row above' },
      row_below: { name: 'Insert row below' },
      remove_row: { name: 'Remove row' },
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
