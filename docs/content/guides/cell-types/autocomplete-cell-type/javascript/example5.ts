import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;

const shipmentKVData = [
  [
    'Electronics and Gadgets',
    { key: 'LAX', value: 'Los Angeles International Airport' },
  ],
  [
    'Medical Supplies',
    { key: 'JFK', value: 'John F. Kennedy International Airport' }
  ],
  [
    'Auto Parts',
    { key: 'ORD', value: "Chicago O'Hare International Airport" }
  ],
  [
    'Fresh Produce',
    { key: 'LHR', value: 'London Heathrow Airport' }
  ],
  [
    'Textiles',
    { key: 'CDG', value: 'Charles de Gaulle Airport' }
  ],
  [
    'Industrial Equipment',
    { key: 'DXB', value: 'Dubai International Airport' }
  ],
  [
    'Pharmaceuticals',
    { key: 'HND', value: 'Tokyo Haneda Airport' }
  ],
  [
    'Consumer Goods',
    { key: 'PEK', value: 'Beijing Capital International Airport' }
  ],
  [
    'Machine Parts',
    { key: 'SIN', value: 'Singapore Changi Airport' }
  ],
  [
    'Food Products',
    { key: 'AMS', value: 'Amsterdam Airport Schiphol' }
  ]
];

const airportKVData = [
  { key: 'LAX', value: 'Los Angeles International Airport' },
  { key: 'JFK', value: 'John F. Kennedy International Airport' },
  { key: 'ORD', value: "Chicago O'Hare International Airport" },
  { key: 'LHR', value: 'London Heathrow Airport' },
  { key: 'CDG', value: 'Charles de Gaulle Airport' },
  { key: 'DXB', value: 'Dubai International Airport' },
  { key: 'HND', value: 'Tokyo Haneda Airport' },
  { key: 'PEK', value: 'Beijing Capital International Airport' },
  { key: 'SIN', value: 'Singapore Changi Airport' },
  { key: 'AMS', value: 'Amsterdam Airport Schiphol' },
  { key: 'FRA', value: 'Frankfurt Airport' },
  { key: 'ICN', value: 'Seoul Incheon International Airport' },
  { key: 'YYZ', value: 'Toronto Pearson International Airport' },
  { key: 'MAD', value: 'Madrid-Barajas Airport' },
  { key: 'BKK', value: 'Bangkok Suvarnabhumi Airport' },
  { key: 'MUC', value: 'Munich International Airport' },
  { key: 'SYD', value: 'Sydney Kingsford Smith Airport' },
  { key: 'BCN', value: 'Barcelona-El Prat Airport' },
  { key: 'KUL', value: 'Kuala Lumpur International Airport' },
  { key: 'ZRH', value: 'Zurich Airport' }
];

new Handsontable(container, {
  themeName: 'ht-theme-main',
  licenseKey: 'non-commercial-and-evaluation',
  data: shipmentKVData,
  columns: [
    {
      title: 'Shipment',
    },
    {
      type: 'autocomplete',
      source: airportKVData,
      title: 'Airport',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
