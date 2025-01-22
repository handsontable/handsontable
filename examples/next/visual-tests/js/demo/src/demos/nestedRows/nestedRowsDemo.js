import Handsontable from 'handsontable';
import { scenarioDataBottom } from './nestedRowsData';
import { getThemeNameFromURL } from '../../utils';

const mergeCells = [];
let rowIndex = 0;

scenarioDataBottom.forEach(() => {
  mergeCells.push({
    row: rowIndex,
    col: 0,
    rowspan: 1,
    colspan: 11,
  });

  rowIndex += 10;
});

const root = document.getElementById('root');

const container = document.createElement('div');
root.appendChild(container);

export function initializeNestedRowsDemo() {
  const hot = new Handsontable(container, {
    data: scenarioDataBottom,
    themeName: getThemeNameFromURL(),
    height: 450,
    rowHeaderWidth: 150,
    colHeaders: [
      'Category',
      'Product ID',
      'Industry',
      'Business Scale',
      'User Type',
      'No of Users',
      'Deployment',
      'OS',
      'Mobile Apps',
      'Pricing',
      'Rating',
    ],
    columnSummary: [
      {
        sourceColumn: 10,
        type: 'average',
        destinationRow: 0,
        destinationColumn: 10,
        // force this column summary to treat non-numeric values as numeric values
        forceNumeric: true,
      },
    ],
    columns: [
      { data: 'category', type: 'text' },
      { data: 'product_id', type: 'numeric' },
      { data: 'industry', type: 'text' },
      { data: 'business_scale', type: 'text' },
      { data: 'user_type', type: 'text' },
      { data: 'no_of_users', type: 'text' },
      { data: 'deployment', type: 'text' },
      { data: 'OS', type: 'text' },
      { data: 'mobile_apps', type: 'text' },
      { data: 'pricing', type: 'text' },
      { data: 'rating', type: 'numeric' },
    ],
    dropdownMenu: true,
    hiddenColumns: {
      columns: [1],
      indicators: true,
    },
    hiddenRows: {
      rows: [3, 4, 5, 14, 15, 16, 19],
      // show UI indicators to mark hidden rows
      indicators: true,
    },
    navigableHeaders: true,
    contextMenu: true,
    rowHeaders: true,
    manualRowMove: true,
    comments: true,
    manualColumnMove: true,
    customBorders: true,
    autoWrapCol: true,
    autoWrapRow: true,
    nestedRows: true,
    bindRowsWithHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    mergeCells: mergeCells,
    cells(row, col, prop) {
      const cellProperties = {};

      // Apply readOnly to merged cells
      mergeCells.forEach((merge) => {
        if (
          row >= merge.row &&
          row < merge.row + merge.rowspan &&
          col >= merge.col &&
          col < merge.col + merge.colspan
        ) {
          cellProperties.readOnly = true;
        }
      });

      return cellProperties;
    },
  });
  hot.addHook('afterGetRowHeader', (row, TH) => {
    if (row % 10 !== 0) {
      TH.textContent = ('Row' + ` ${row + 1} `).repeat(row % 10);
    }
  });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
