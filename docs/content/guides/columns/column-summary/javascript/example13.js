import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const data = [
  {
    item: 'Operations',
    amount: null,
    __children: [
      { item: 'Rent', amount: 4200 },
      { item: 'Utilities', amount: 650 },
      {
        item: 'Payroll',
        amount: null,
        __children: [
          { item: 'Engineering', amount: 18500 },
          { item: 'Design', amount: 7400 },
          { item: 'Support', amount: 5100 },
        ],
      },
    ],
  },
];

// Give every parent a summary of its direct children. Physical rows follow the data tree,
// so the endpoints stay right while a group is collapsed. Returns the rows `line` spans.
const addEndpoints = (endpoints, line, physicalRow) => {
  const ranges = [];
  let nextRow = physicalRow + 1;

  (line.__children ?? []).forEach((child) => {
    ranges.push([nextRow, nextRow]);
    nextRow += addEndpoints(endpoints, child, nextRow);
  });

  if (ranges.length > 0) {
    endpoints.push({
      sourceColumn: 1,
      destinationColumn: 1,
      destinationRow: physicalRow,
      type: 'sum',
      ranges,
      includeSummaryResults: true,
    });
  }

  return nextRow - physicalRow;
};

const container = document.querySelector('#example13');

new Handsontable(container, {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data,
  columns: [{ data: 'item' }, { data: 'amount', type: 'numeric' }],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['Budget line', 'Amount (USD)'],
  columnSummary() {
    const endpoints = [];
    let physicalRow = 0;

    data.forEach((line) => {
      physicalRow += addEndpoints(endpoints, line, physicalRow);
    });

    return endpoints;
  },
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});
