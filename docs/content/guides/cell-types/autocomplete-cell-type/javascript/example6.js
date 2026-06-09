import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const fruits = [
  'Apple',
  'Apricot',
  'Avocado',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Lemon',
  'Lime',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Raspberry',
  'Strawberry',
  'Watermelon',
];

const container = document.querySelector('#example6');

new Handsontable(container, {
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Apple', 'Apple'],
    ['Banana', 'Banana'],
    ['Cherry', 'Cherry'],
    ['Mango', 'Mango'],
    ['Orange', 'Orange'],
  ],
  colHeaders: ['Filter: true (default)', 'Filter: false'],
  columns: [
    {
      type: 'autocomplete',
      source: fruits,
      strict: false,
      // filter: true is the default — only matching options are shown
    },
    {
      type: 'autocomplete',
      source: fruits,
      strict: false,
      // don't hide options that don't match the search query
      filter: false,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
