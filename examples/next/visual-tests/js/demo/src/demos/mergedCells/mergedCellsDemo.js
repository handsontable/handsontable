import Handsontable from 'handsontable';
import { data } from './mergedCellsData';
import { getThemeNameFromURL } from '../../utils';

const root = document.getElementById('root');

const container = document.createElement('div');
root.appendChild(container);

const mergedCells = [
  { row: 1, col: 0, rowspan: 1, colspan: 2 },
  { row: 2, col: 0, rowspan: 1, colspan: 2 },
  { row: 5, col: 1, rowspan: 2, colspan: 2 },
  { row: 10, col: 0, rowspan: 3, colspan: 3 },
];

export function initializeMergedCellsDemo() {
  const hot = new Handsontable(container, {
    data,
    themeName: getThemeNameFromURL(),
    height: 550,
    autoColumnSize: true,
    colHeaders: [
      'Company name',
      'Country',
      'Name',
      'Sell date',
      'Order ID',
      'In stock',
      'Qty',
    ],
    columns: [
      { data: 1, type: 'text', headerClassName: 'htRight bold-text green' },
      { data: 2, type: 'text' },
      {
        data: 3,
        type: 'text',
        headerClassName: 'htCenter bold-text italic-text',
      },
      {
        data: 4,
        type: 'date',
        allowInvalid: false,
      },
      { data: 5, type: 'text' },
      {
        data: 6,
        type: 'checkbox',
        className: 'htCenter',
        headerClassName: 'htCenter',
      },
      {
        data: 7,
        type: 'numeric',
        headerClassName: 'htRight bold-text',
      },
    ],
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    contextMenu: true,
    multiColumnSorting: {
      initialConfig: [
        {
          column: 3,
          sortOrder: 'asc',
        },
        {
          column: 4,
          sortOrder: 'desc',
        },
      ],
    },
    filters: true,
    rowHeaders: true,
    manualRowMove: true,
    manualRowResize: true,
    rowHeights(visualRowIndex) {
      return visualRowIndex * 1;
    },
    autoWrapCol: true,
    autoWrapRow: true,
    headerClassName: 'htLeft',
    mergeCells: mergedCells,

    licenseKey: 'non-commercial-and-evaluation',
  });

  hot.addHook('afterMergeCells', function (cellRange, mergeParent, auto) {
    const startRow = mergeParent.row;
    const endRow = startRow + mergeParent.rowspan - 1;
    const startCol = mergeParent.col;
    const endCol = startCol + mergeParent.colspan - 1;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hot.getCellMeta(row, col).className = 'htMergedCell';
      }
    }
    hot.render();
  });
  hot.setDataAtCell(3, 2, 'A very long text here');
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
