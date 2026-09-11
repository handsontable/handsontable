import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

// The first row holds a target and the last one a total. Both are frozen, so they stay in
// view while you scroll.
const getData = () => [
  ['Target', 30000, 225],
  ['North', 42300, 318],
  ['South', 18750, 142],
  ['East', 27900, 205],
  ['West', 35100, 264],
  ['Total', 124050, 929],
];

// Everything the two grids share. Only `sortFixedRows` differs between them.
const sharedSettings: GridSettings = {
  colHeaders: ['Region', 'Revenue', 'Orders'],
  columns: [
    { type: 'text' },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
      },
    },
    { type: 'numeric' },
  ],
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
};

// Both grids start sorted by revenue, highest first.
const initialConfig = { column: 1, sortOrder: 'desc' as const };
// `sortFixedRows: false` is the default: the frozen rows keep their place whatever you sort by.
const defaultSorting = { initialConfig };
const allRowsSorting = { sortFixedRows: true, initialConfig };

const defaultData = getData();
const allRowsData = getData();

const ExampleComponent = () => (
  <>
    <h3 className="demo-preview">Default: the frozen rows keep their place</h3>
    <HotTable {...sharedSettings} data={defaultData} columnSorting={defaultSorting} />
    <h3 className="demo-preview">
      With <code>sortFixedRows: true</code>: the frozen rows are sorted too
    </h3>
    <HotTable {...sharedSettings} data={allRowsData} columnSorting={allRowsSorting} />
  </>
);

export default ExampleComponent;
