import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [
    { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
    { car: 'Citroen C4 Coupe', year: 2018, price_usd: 8330, price_eur: 8330 },
    { car: 'Audi A4 Avant', year: 2019, price_usd: 33900, price_eur: 33900 },
    { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
    { car: 'BMW 320i Coupe', year: 2021, price_usd: 30500, price_eur: 30500 },
  ],
  colHeaders: ['Car', 'Year', 'Price ($)', 'Price (€)'],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car',
      // 1st column is simple text, no special options here
    },
    {
      data: 'year',
      type: 'numeric',
    },
    {
      data: 'price_usd',
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
      },
      allowEmpty: false,
    },
    {
      data: 'price_eur',
      type: 'numeric',
      locale: 'de-DE',
      numericFormat: {
        style: 'currency',
        currency: 'EUR',
      },
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
