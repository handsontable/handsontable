import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const colors = [
  'Black',
  'Blue',
  'brown',
  'cyan',
  'Gray',
  'green',
  'Lime',
  'Magenta',
  'Navy',
  'olive',
  'orange',
  'Pink',
  'Purple',
  'Red',
  'silver',
  'Teal',
  'White',
  'Yellow',
];

const container = document.querySelector('#example7');

new Handsontable(container, {
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Black', 'Black'],
    ['Blue', 'Blue'],
    ['Gray', 'Gray'],
    ['Red', 'Red'],
    ['White', 'White'],
  ],
  colHeaders: ['Case-insensitive (default)', 'Case-sensitive'],
  columns: [
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      // filteringCaseSensitive: false is the default — typing "bl" matches "Black" and "blue"
    },
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      // match case while searching autocomplete options
      filteringCaseSensitive: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
