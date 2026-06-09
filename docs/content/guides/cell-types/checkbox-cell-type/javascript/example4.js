import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4');

new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, comesInBlack: 'no' },
  ],
  colHeaders: ['Car model', 'Year', 'Comes in black'],
  height: 'auto',
  columns: [
    {
      data: 'car',
    },
    {
      data: 'year',
    },
    {
      data: 'comesInBlack',
      type: 'checkbox',
      checkedTemplate: 'yes',
      uncheckedTemplate: 'no',
      label: {
        position: 'after',
        value(row, column, prop, value) {
          if (value === 'yes') {
            return 'In black';
          } else {
            return 'Not in black';
          }
        },
      },
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
