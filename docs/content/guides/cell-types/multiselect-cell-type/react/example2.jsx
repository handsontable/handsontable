import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const shipmentCategories = [
  { key: 'electronics', value: 'Electronics and Gadgets' },
  { key: 'medical', value: 'Medical Supplies' },
  { key: 'auto-parts', value: 'Auto Parts' },
  { key: 'fresh-produce', value: 'Fresh Produce' },
  { key: 'textiles', value: 'Textiles' },
  { key: 'industrial', value: 'Industrial Equipment' },
  { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
  { key: 'consumer', value: 'Consumer Goods' },
  { key: 'machine-parts', value: 'Machine Parts' },
  { key: 'food', value: 'Food Products' },
];

const data = [
  [
    'Los Angeles International Airport',
    [
      { key: 'electronics', value: 'Electronics and Gadgets' },
      { key: 'medical', value: 'Medical Supplies' },
    ],
  ],
  [
    "Chicago O'Hare International Airport",
    [
      { key: 'auto-parts', value: 'Auto Parts' },
      { key: 'fresh-produce', value: 'Fresh Produce' },
    ],
  ],
  [
    'Charles de Gaulle Airport',
    [
      { key: 'textiles', value: 'Textiles' },
      { key: 'industrial', value: 'Industrial Equipment' },
    ],
  ],
  [
    'Tokyo Haneda Airport',
    [
      { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
      { key: 'consumer', value: 'Consumer Goods' },
    ],
  ],
  [
    'Singapore Changi Airport',
    [
      { key: 'machine-parts', value: 'Machine Parts' },
      { key: 'food', value: 'Food Products' },
    ],
  ],
  [
    'Luton Airport',
    [
      { key: 'electronics', value: 'Electronics and Gadgets' },
      { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
    ],
  ],
  [
    'Frankfurt Airport',
    [
      { key: 'industrial', value: 'Industrial Equipment' },
      { key: 'auto-parts', value: 'Auto Parts' },
      { key: 'consumer', value: 'Consumer Goods' },
    ],
  ],
  [
    'Sydney Kingsford Smith Airport',
    [
      { key: 'fresh-produce', value: 'Fresh Produce' },
      { key: 'food', value: 'Food Products' },
    ],
  ],
  [
    'Toronto Pearson International Airport',
    [
      { key: 'medical', value: 'Medical Supplies' },
      { key: 'textiles', value: 'Textiles' },
    ],
  ],
  [
    'Hong Kong International Airport',
    [
      { key: 'machine-parts', value: 'Machine Parts' },
      { key: 'electronics', value: 'Electronics and Gadgets' },
      { key: 'industrial', value: 'Industrial Equipment' },
    ],
  ],
  [
    'Heathrow Airport',
    [
      { key: 'textiles', value: 'Textiles' },
      { key: 'consumer', value: 'Consumer Goods' },
    ],
  ],
];

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={data}
      columns={[
        {
          title: 'Airport',
        },
        {
          type: 'multiselect',
          source: shipmentCategories,
          title: 'Shipment',
        },
      ]}
      height="auto"
      stretchH="last"
      width="100%"
    />
  );
};

export default ExampleComponent;
