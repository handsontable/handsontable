import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const statuses: string[] = [
  'Backlog',
  'In progress',
  'Blocked',
  'Done',
  'Cancelled',
];

const container = document.querySelector('#example8')!;

new Handsontable(container, {
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Backlog', 'Backlog'],
    ['In progress', 'In progress'],
    ['Blocked', 'Blocked'],
    ['Done', 'Done'],
    ['Cancelled', 'Cancelled'],
  ],
  colHeaders: ['Source order (default)', 'Alphabetical order'],
  columns: [
    {
      type: 'autocomplete',
      source: statuses,
      strict: false,
      // sortByRelevance: true is the default — suggestions keep the order from `source`
    },
    {
      type: 'autocomplete',
      source: statuses,
      strict: false,
      // sort suggestions alphabetically instead of using the `source` order
      sortByRelevance: false,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
