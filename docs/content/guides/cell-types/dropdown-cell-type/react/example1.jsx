import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware', 'Seattle'],
  ['SKU-0093', 'Wireless Mouse', 'Electronics', 'Denver'],
  ['SKU-1170', 'Ergonomic Office Chair', 'Furniture', 'Portland'],
  ['SKU-2208', 'USB-C Charging Cable', 'Electronics', 'Austin'],
  ['SKU-3341', 'Aluminum Water Filter', 'Drinkware', 'Minneapolis'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      height="auto"
      data={data}
      colHeaders={['SKU', 'Product', 'Category', 'Warehouse']}
      columns={[
        {},
        {},
        {
          type: 'dropdown',
          source: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
        },
        {
          type: 'dropdown',
          source: [
            'Seattle',
            'Denver',
            'Portland',
            'Austin',
            'Minneapolis',
            'Boston',
            'Chicago',
            'Phoenix',
            'Atlanta',
            'Dallas',
            'San Jose',
            'Columbus',
          ],
        },
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
