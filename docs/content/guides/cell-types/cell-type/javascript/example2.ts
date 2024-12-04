import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['empty string', '', '', '', '', ''],
    ['null', null, null, null, null, null],
    ['undefined', undefined, undefined, undefined, undefined, undefined],
    ['non-empty value', 'non-empty text', 13000, true, 'orange', 'password'],
  ],
  columnSorting: {
    sortEmptyCells: true,
  },
  columns: [
    {
      columnSorting: {
        indicator: false,
        headerAction: false,
        compareFunctionFactory: function compareFunctionFactory() {
          return function comparator() {
            return 0; // Don't sort the first visual column.
          };
        },
      },
      readOnly: true,
    },
    {},
    {
      type: 'numeric',
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US', // this is the default culture, set up for USD
      },
    },
    { type: 'checkbox' },
    { type: 'dropdown', source: ['yellow', 'red', 'orange'] },
    { type: 'password' },
  ],
  preventOverflow: 'horizontal',
  colHeaders: [
    'value<br>underneath',
    'type:text',
    'type:numeric',
    'type:checkbox',
    'type:dropdown',
    'type:password',
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
