import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

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
  ['Luton Airport', ['Electronics and Gadgets', 'Pharmaceuticals']],
  ['Frankfurt Airport', ['Industrial Equipment', 'Auto Parts', 'Consumer Goods']],
  ['Sydney Kingsford Smith Airport', ['Fresh Produce', 'Food Products']],
  ['Toronto Pearson International Airport', ['Medical Supplies', 'Textiles']],
  ['Hong Kong International Airport', ['Machine Parts', 'Electronics and Gadgets', 'Industrial Equipment']],
  ['Heathrow Airport', ['Textiles', 'Consumer Goods']],
];

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data,
  columns: [
    {
      title: 'Airport',
    },
    {
      type: 'multiselect',
      source: shipmentCategories,
      title: 'Shipment',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'last',
  width: '100%',
});
