import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example10');

// each `value` is an object, so the cell stores the whole airport, not only its name
const airports = [
  { key: 'LAX', value: { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' } },
  { key: 'JFK', value: { name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' } },
  { key: 'LHR', value: { name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' } },
  { key: 'CDG', value: { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' } },
  { key: 'HND', value: { name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan' } },
  { key: 'SIN', value: { name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' } },
];

const shipments = [
  ['Electronics and Gadgets', airports[0]],
  ['Medical Supplies', airports[1]],
  ['Fresh Produce', airports[2]],
  ['Textiles', airports[3]],
  ['Pharmaceuticals', airports[4]],
];

new Handsontable(container, {
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  data: shipments,
  columns: [
    {
      title: 'Shipment',
    },
    {
      type: 'autocomplete',
      source: airports,
      // display the city and the name of each airport
      sourceLabel: (airport) => `${airport.city} - ${airport.name}`,
      title: 'Destination airport',
      width: 400,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
