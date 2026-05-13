import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const shipmentCategories: string[] = [
  'Electronics and Gadgets',
  'Medical Supplies',
  'Auto Parts',
  'Fresh Produce',
  'Textiles',
  'Industrial Equipment',
  'Pharmaceuticals',
  'Consumer Goods',
  'Machine Parts',
  'Food Products',
];

const data: (string | string[])[][] = [
  ['Los Angeles International Airport', ['Electronics and Gadgets', 'Medical Supplies']],
  ["Chicago O'Hare International Airport", ['Auto Parts', 'Fresh Produce']],
  ['Charles de Gaulle Airport', ['Textiles', 'Industrial Equipment']],
  ['Tokyo Haneda Airport', ['Pharmaceuticals', 'Consumer Goods']],
  ['Singapore Changi Airport', ['Machine Parts', 'Food Products']],
  ['Luton Airport', ['Electronics and Gadgets', 'Pharmaceuticals']],
  ['Frankfurt Airport', ['Industrial Equipment', 'Auto Parts', 'Consumer Goods']],
  ['Sydney Kingsford Smith Airport', ['Fresh Produce', 'Food Products']],
  ['Toronto Pearson International Airport', ['Medical Supplies', 'Textiles']],
  ['Hong Kong International Airport', ['Machine Parts', 'Electronics and Gadgets', 'Industrial Equipment']],
  ['Heathrow Airport', ['Textiles', 'Consumer Goods']],
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
