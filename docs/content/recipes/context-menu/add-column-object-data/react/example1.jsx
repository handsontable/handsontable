import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

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

// `columns` and `colHeaders` live outside the component so the custom menu item
// can extend them and push the change back through `updateSettings`.
const columns = [
  { data: 'sku', width: 120 },
  { data: 'supplier', width: 170 },
  { data: 'stock', width: 90 },
  { data: 'category', width: 130 },
];
const colHeaders = ['SKU', 'Supplier', 'Stock', 'Category'];

let newColumnCount = 0;

const ExampleComponent = () => {
  const hotRef = useRef(null);

  return (
    <HotTable
      ref={hotRef}
      id="example1"
      data={data}
      rowHeaders={true}
      colHeaders={colHeaders}
      columns={columns}
      height="auto"
      width="100%"
      contextMenu={{
        items: {
          add_column: {
            name: 'Add column',
            callback(key, selection) {
              const hot = hotRef.current?.hotInstance;

              if (!hot) return;

              const insertAt = selection[0].start.col + 1;

              newColumnCount += 1;
              const newKey = `custom_${newColumnCount}`;

              hot.getSourceData().forEach((row) => {
                row[newKey] = '';
              });

              columns.splice(insertAt, 0, { data: newKey, width: 130, className: 'ht-new-column' });
              colHeaders.splice(insertAt, 0, `Custom ${newColumnCount}`);

              hot.updateSettings({ columns, colHeaders });
            },
          },
          sep1: '---------',
          row_above: { name: 'Insert row above' },
          row_below: { name: 'Insert row below' },
          remove_row: { name: 'Remove row' },
        },
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
