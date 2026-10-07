import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
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
const createGrid = (container, sortFixedRows) => new Handsontable(container, {
    data: getData(),
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
    columnSorting: {
        // `false` is the default: the frozen rows keep their place whatever you sort by.
        sortFixedRows,
        // Both grids start sorted by revenue, highest first.
        initialConfig: { column: 1, sortOrder: 'desc' },
    },
    height: 'auto',
    stretchH: 'all',
    licenseKey: 'non-commercial-and-evaluation',
});
createGrid(document.querySelector('#exampleSortFixedRows1'), false);
createGrid(document.querySelector('#exampleSortFixedRows2'), true);
