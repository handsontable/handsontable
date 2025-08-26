import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const colors: string[] = [
  'yellow',
  'red',
  'orange and another color',
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

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {
      type: 'autocomplete',
      source: ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'],
      strict: false,
    },
    { type: 'numeric' },
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      visibleRows: 4,
    },
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      trimDropdown: false,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
