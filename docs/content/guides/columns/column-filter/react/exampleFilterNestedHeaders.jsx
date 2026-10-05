// to import filtering as an individual module, see the 'Import the filtering module' section of this page
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
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      nestedHeaders={[
        [
          { label: 'Item', colspan: 2 },
          { label: 'Supply chain', colspan: 3 },
        ],
        ['SKU', 'Product name', 'Supplier', 'Category', 'Warehouse'],
      ]}
      // enable filtering
      filters={true}
      // enable the column menu
      dropdownMenu={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
