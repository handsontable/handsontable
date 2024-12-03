import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes' },
    {
      car: 'Citroen C4 Coupe',
      year: 2018,
      available: false,
      comesInBlack: 'yes',
    },
    { car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no' },
  ],
  colHeaders: ['Car model', 'Year of manufacture', 'Available'],
  height: 'auto',
  columns: [
    {
      data: 'car',
    },
    {
      data: 'year',
      type: 'numeric',
    },
    {
      data: 'available',
      type: 'checkbox',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
