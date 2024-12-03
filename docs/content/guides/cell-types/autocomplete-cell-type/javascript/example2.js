import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const colors = [
  'yellow',
  'red',
  'orange',
  'green',
  'blue',
  'gray',
  'black',
  'white',
  'purple',
  'lime',
  'olive',
  'cyan',
];

const cars = ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'];

const container = document.querySelector('#example2');

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
  ],
  colHeaders: [
    'Car<br>(allowInvalid true)',
    'Year',
    'Chassis color<br>(allowInvalid false)',
    'Bumper color<br>(allowInvalid true)',
  ],
  columns: [
    {
      type: 'autocomplete',
      source: cars,
      strict: true,
    },
    {},
    {
      type: 'autocomplete',
      source: colors,
      strict: true,
      allowInvalid: false,
    },
    {
      type: 'autocomplete',
      source: colors,
      strict: true,
      allowInvalid: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
