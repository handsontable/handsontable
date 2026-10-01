import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
  ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
  ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
  ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
  ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
];

const ExampleComponent = () => {
  const warehouses = [
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
  ];
  const products = [
    'Stainless Steel Water Bottle',
    'Wireless Mouse',
    'Ergonomic Office Chair',
    'USB-C Charging Cable',
    'Aluminum Water Filter',
    'Canvas Tote Bag',
    'USB-C Hub',
    'Ceramic Mug Set',
    'Desk Lamp',
    'Laptop Stand',
    'Bluetooth Speaker',
    'Standing Desk',
  ];

  return (
    <HotTable
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={data}
      colHeaders={['Supplier', 'SKU', 'Warehouse', 'Product']}
      columns={[
        {
          type: 'autocomplete',
          source: [
            'Harbor Goods',
            'Alpine Supply Co.',
            'Cascade Distributors',
            'Summit Trading',
            'Northgate Wholesale',
            'Nordic Traders',
          ],
          strict: false,
        },
        {},
        {
          type: 'autocomplete',
          source: warehouses,
          strict: false,
          visibleRows: 4,
        },
        {
          type: 'autocomplete',
          source: products,
          strict: false,
          trimDropdown: false,
        },
      ]}
    />
  );
};

export default ExampleComponent;
