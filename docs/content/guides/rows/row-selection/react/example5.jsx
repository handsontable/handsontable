import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  {
    name: 'Electronics',
    sku: null,
    stock: null,
    __children: [
      {
        name: 'Audio',
        sku: null,
        stock: null,
        __children: [
          { name: 'Wireless Headphones', sku: 'SKU-2001', stock: 34 },
          { name: 'Bluetooth Speaker', sku: 'SKU-2002', stock: 12 },
        ],
      },
      {
        name: 'Computer Accessories',
        sku: null,
        stock: null,
        __children: [
          { name: 'Wireless Mouse', sku: 'SKU-0093', stock: 120 },
          { name: 'USB-C Charging Cable', sku: 'SKU-2208', stock: 310 },
          { name: 'Laptop Stand', sku: 'SKU-3105', stock: 0 },
        ],
      },
    ],
  },
  {
    name: 'Home & Office',
    sku: null,
    stock: null,
    __children: [
      {
        name: 'Furniture',
        sku: null,
        stock: null,
        __children: [
          { name: 'Ergonomic Office Chair', sku: 'SKU-1170', stock: 8 },
          { name: 'Standing Desk', sku: 'SKU-1185', stock: 5 },
        ],
      },
      {
        name: 'Lighting',
        sku: null,
        stock: null,
        __children: [{ name: 'Desk Lamp', sku: 'SKU-1402', stock: 46 }],
      },
    ],
  },
  {
    name: 'Drinkware',
    sku: null,
    stock: null,
    __children: [
      { name: 'Stainless Steel Water Bottle', sku: 'SKU-4821', stock: 75 },
      { name: 'Aluminum Water Filter', sku: 'SKU-3341', stock: 22 },
    ],
  },
];

const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    // preselect the Wireless Mouse and the Desk Lamp to show the mixed parents
    hotRef.current?.hotInstance?.getPlugin('rowSelection').selectRows([5, 13]);
  }, []);

  return (
    <HotTable
      ref={hotRef}
      licenseKey="non-commercial-and-evaluation"
      data={data}
      height="auto"
      width="100%"
      stretchH="all"
      colHeaders={['Name', 'SKU', 'Stock']}
      columns={[{ data: 'name' }, { data: 'sku' }, { data: 'stock', type: 'numeric' }]}
      // the collapse buttons live in the row headers
      rowHeaders={true}
      nestedRows={true}
      // the default `groupSelects: 'descendants'`: a parent row selects every row under it,
      // and shows a mixed state while only some of them are selected
      rowSelection={true}
      navigableHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
    />
  );
};

export default ExampleComponent;
