import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle'],
  ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver'],
  ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland'],
  ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin'],
  ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Minneapolis'],
  ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel', 'Boston'],
  ['SKU-5088', 'USB-C Hub', 'Harbor Goods', 'Electronics', 'Chicago'],
  ['SKU-6120', 'Ceramic Mug Set', 'Alpine Supply Co.', 'Drinkware', 'Phoenix'],
  ['SKU-7294', 'Desk Lamp', 'Cascade Distributors', 'Furniture', 'Atlanta'],
  ['SKU-8015', 'Laptop Stand', 'Summit Trading', 'Furniture', 'Dallas'],
  ['SKU-9166', 'Bluetooth Speaker', 'Northgate Wholesale', 'Electronics', 'San Jose'],
  ['SKU-1042', 'Standing Desk', 'Nordic Traders', 'Furniture', 'Columbus'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      width="100%"
      height={320}
      rowHeaders={true}
      colHeaders={true}
      colWidths={100}
      manualRowMove={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
