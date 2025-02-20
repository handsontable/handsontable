import Handsontable from 'handsontable';

import { data } from './customStyleData';

const root = document.getElementById('root');

const container = document.createElement('div');
root.appendChild(container);

const mergedCells = [
  { row: 1, col: 0, rowspan: 1, colspan: 2 },
  { row: 2, col: 0, rowspan: 1, colspan: 2 },
  { row: 5, col: 1, rowspan: 2, colspan: 2 },
  { row: 10, col: 0, rowspan: 3, colspan: 3 },
];

export function initializeCustomStyleDemo() {
  const hot = new Handsontable(container, {
    data,
    height: 450,
    colWidths: [170, 156, 222, 130, 130, 120, 120],
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
    customBorders: [
      {
        range: {
          from: { row: 1, col: 1 },
          to: { row: 1, col: 1 },
        },
        top: { width: 2, color: 'red' },
        left: { width: 2, color: 'red' },
        bottom: { width: 2, color: 'red' },
        right: { width: 2, color: 'red' },
      },
      {
        range: {
          from: { row: 3, col: 3 },
          to: { row: 3, col: 3 },
        },
        top: { width: 2, color: 'blue' },
        left: { width: 2, color: 'blue' },
        bottom: { width: 2, color: 'blue' },
        right: { width: 2, color: 'blue' },
      },
    ],
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    contextMenu: true,
    multiColumnSorting: true,
    filters: true,
    manualRowMove: true,
    autoWrapCol: true,
    autoWrapRow: true,
    renderAllRows: true,
    headerClassName: 'htLeft',
    mergeCells: mergedCells,
    className: 'handsontable-container',
    cells(row, col) {
      const cellProperties = {};

      if (row === 1 && col === 1) {
        cellProperties.renderer = customRenderer;
      } else if (row === 3 && col === 3) {
        cellProperties.renderer = customRenderer;
      }

      return cellProperties;
    },
    licenseKey: 'non-commercial-and-evaluation',
  });

  // Custom renderer function
  function customRenderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    td.style.backgroundColor = '#e1f5fe';
    td.style.fontWeight = 'bold';
    td.style.color = '#0277bd';
  }

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
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
