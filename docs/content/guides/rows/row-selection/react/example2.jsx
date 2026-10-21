import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware'],
  ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics'],
  ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture'],
  ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics'],
  ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware'],
  ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={data}
      height="auto"
      colHeaders={['SKU', 'Product', 'Supplier', 'Category']}
      // no row numbers: the checkbox column is the only row header
      rowHeaders={false}
      // reach the header checkbox with the arrow keys, toggle it with Space
      navigableHeaders={true}
      rowSelection={true}
      autoWrapRow={true}
      autoWrapCol={true}
    />
  );
};

export default ExampleComponent;
