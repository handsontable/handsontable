import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3')!;

const requiredItems = ['Passport', 'Tickets', 'Wallet', 'Phone', 'Keys'];
const optionalExtras = ['Snacks', 'Book', 'Camera', 'Umbrella', 'First aid kit'];
const interests = ['Art', 'History', 'Nature', 'Food', 'Shopping'];

const data = [
  [['Passport', 'Phone'], ['Snacks', 'Book'], ['Nature']],
  [['Tickets', 'Wallet'], ['Camera'], []],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
];

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data,
  columns: [
    {
      type: 'multiselect',
      source: requiredItems,
      title: 'Required items',
      allowEmpty: false,
    },
    {
      type: 'multiselect',
      source: optionalExtras,
      title: 'Optional extras',
      placeholder: 'Select up to 3',
      maxSelections: 3,
      visibleRows: 4,
      searchInput: false,
    },
    {
      type: 'multiselect',
      source: interests,
      title: 'Interests',
      placeholder: 'Select interests',
      sourceSortFunction: (entries: string[]) => [...entries].sort((a, b) => a.localeCompare(b)),
      filteringCaseSensitive: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'last',
  width: '100%',
});
