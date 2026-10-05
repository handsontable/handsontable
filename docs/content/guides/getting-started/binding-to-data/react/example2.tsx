import { FC } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data: string[][] = [
  ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle'],
  ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver'],
  ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland'],
  ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin'],
  ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Minneapolis'],
];

const ExampleComponent: FC = () => (
  <HotTable
    data={data}
    colHeaders={['SKU', 'Product', 'Category', 'Warehouse']}
    height="auto"
    width="auto"
    columns={[
      { data: 0 },
      { data: 1 },
      // skip the third column
      { data: 3 },
      { data: 4 },
    ]}
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
