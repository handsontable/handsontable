import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const shipmentCategories = [
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

const data = [
  ['Los Angeles International Airport', ['Electronics and Gadgets', 'Medical Supplies']],
  ['Chicago O\'Hare International Airport', ['Auto Parts', 'Fresh Produce']],
  ['Charles de Gaulle Airport', ['Textiles', 'Industrial Equipment']],
  ['Tokyo Haneda Airport', ['Pharmaceuticals', 'Consumer Goods']],
  ['Singapore Changi Airport', ['Machine Parts', 'Food Products']],
];

const ExampleComponent = () => {
  return (
    <HotTable
      themeName="ht-theme-main"
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
      preventOverflow="horizontal"
      colWidths={300}
    />
  );
};

export default ExampleComponent;
