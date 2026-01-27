import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const localeSelect = document.querySelector('#localeSelect');

// Sample data with various numeric types
const data = [
  {
    car: 'Mercedes A 160',
    year: 2017,
    price_usd: 7000,
    price_eur: 7000,
    distance_km: 125000,
    fuel_liters: 45.5,
    discount_percent: 0.15,
    quantity: 1250
  },
  {
    car: 'Citroen C4 Coupe',
    year: 2018,
    price_usd: 8330,
    price_eur: 8330,
    distance_km: 98000,
    fuel_liters: 52.3,
    discount_percent: 0.08,
    quantity: 2100
  },
  {
    car: 'Audi A4 Avant',
    year: 2019,
    price_usd: 33900,
    price_eur: 33900,
    distance_km: 45000,
    fuel_liters: 60.0,
    discount_percent: 0.05,
    quantity: 850
  },
  {
    car: 'Opel Astra',
    year: 2020,
    price_usd: 5000,
    price_eur: 5000,
    distance_km: 156000,
    fuel_liters: 48.7,
    discount_percent: 0.12,
    quantity: 3200
  },
  {
    car: 'BMW 320i Coupe',
    year: 2021,
    price_usd: 30500,
    price_eur: 30500,
    distance_km: 32000,
    fuel_liters: 55.2,
    discount_percent: 0.03,
    quantity: 1500
  },
];

// Initialize Handsontable
const hot = new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: data,
  colHeaders: ['Car', 'Year', 'Price (USD)', 'Price (EUR)', 'Distance', 'Fuel', 'Discount', 'Quantity'],
  columns: [
    {
      data: 'car',
      type: 'text',
    },
    {
      data: 'year',
      type: 'numeric',
    },
    {
      data: 'price_usd',
      type: 'numeric',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      },
    },
    {
      data: 'price_eur',
      type: 'numeric',
      numericFormat: {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      },
    },
    {
      data: 'distance_km',
      type: 'numeric',
      numericFormat: {
        style: 'unit',
        unit: 'kilometer',
        useGrouping: true,
      },
    },
    {
      data: 'fuel_liters',
      type: 'numeric',
      numericFormat: {
        style: 'unit',
        unit: 'liter',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
    },
    {
      data: 'discount_percent',
      type: 'numeric',
      numericFormat: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    },
    {
      data: 'quantity',
      type: 'numeric',
      numericFormat: {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 0,
      },
    },
  ],
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  autoWrapRow: true,
  autoWrapCol: true,
});

// Handle locale change
localeSelect.addEventListener('change', (event) => {
  hot.updateSettings({
    locale: event.target.value,
  });
});
