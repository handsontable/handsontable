import { FC } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['SKU-4821', 'Wireless Mouse', 142, 'Electronics'],
  ['SKU-0093', 'USB-C Cable', 67, 'Electronics'],
  ['SKU-1175', 'Desk Lamp', 0, 'Home Office'],
  ['SKU-3340', 'Notebook', 230, 'Stationery'],
  ['SKU-7782', 'Standing Desk', 18, 'Furniture'],
];

const ExampleComponent: FC = () => (
  <HotTable
    id="inventory-grid"
    className="inventory-grid"
    style={{ border: '1px solid #4caf50' }}
    data={data}
    colHeaders={['SKU', 'Product', 'Stock', 'Category']}
    height="auto"
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
