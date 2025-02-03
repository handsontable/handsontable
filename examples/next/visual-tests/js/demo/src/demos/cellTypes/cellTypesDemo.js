import Handsontable from 'handsontable';
import { data, subData } from '././cellTypesData';
import { getThemeNameFromURL } from '../../utils';

const root = document.getElementById('root');

const container = document.createElement('div');
root.appendChild(container);

function operationalStatusRenderer(
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);

  td.style.backgroundColor = '';
  td.style.color = '';

  if (value === 'Operational') {
    td.style.backgroundColor = 'green';
    td.style.color = 'white';
  } else if (value === 'In Maintenance') {
    td.style.backgroundColor = 'orange';
    td.style.color = 'white';
  } else if (value === 'Awaiting Parts') {
    td.style.backgroundColor = 'red';
    td.style.color = 'white';
  } else if (value === 'Ready for Testing') {
    td.style.backgroundColor = 'blue';
    td.style.color = 'white';
  } else if (value === 'Decommissioned') {
    td.style.backgroundColor = 'gray';
    td.style.color = 'white';
  }
}

export function initializeCellTypeDemo() {
  new Handsontable(container, {
    data,
    colHeaders: [
      'ID',
      'Name',
      'Item No.',
      'Lead Engineer',
      'Cost',
      'In Stock',
      'Category',
      'Item Quality',
      'Origin',
      'Quantity',
      'Value Stock',
      'Repairable',
      'Supplier Name',
      'Restock Date',
      'Test result',
      'Operational Status',
    ],
    themeName: getThemeNameFromURL(),
    rowHeaders: true,
    height: 600,
    width: 1200,
    autoWrapRow: true,
    autoWrapCol: true,
    dropdownMenu: true,
    filters: true,
    contextMenu: true,
    manualColumnFreeze: true,
    manualRowMove: true,
    manualColumnMove: true,
    manualColumnResize: true,
    manualRowResize: true,
    multiColumnSorting: true,
    hiddenColumns: {
      columns: [0, 2],
      indicators: true,
    },
    fixedColumnsStart: 3,
    columns: [
      { data: 'id', type: 'numeric', width: 150 },
      {
        data: 'itemName',
        type: 'text',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 70,
      },
      {
        data: 'itemNo',
        type: 'text',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 150,
      },
      {
        data: 'leadEngineer',
        type: 'text',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 150,
      },
      {
        data: 'cost',
        type: 'numeric',
        numericFormat: { pattern: '$0,0.00' },
        headerClassName: 'htRight',
        className: 'htRight',
        width: 150,
      },
      {
        data: 'inStock',
        type: 'checkbox',
        headerClassName: 'htCenter',
        className: 'htCenter',
        width: 100,
      },
      {
        data: 'category',
        type: 'autocomplete',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 150,
        source: [
          'Lander',
          'Propulsion',
          'Equipment',
          'Energy',
          'Communication',
          'Shelter',
          'Life Support',
          'Mining',
          'Navigation',
          'Exploration',
        ],
      },
      {
        data: 'itemQuality',
        type: 'numeric',
        numericFormat: { pattern: '0%' },
        headerClassName: 'htRight',
        className: 'htRight',
        width: 100,
      },
      {
        data: 'origin',
        type: 'text',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 150,
      },
      {
        data: 'quantity',
        type: 'numeric',
        headerClassName: 'htRight',
        className: 'htRight',
        width: 100,
      },
      {
        data: 'valueStock',
        type: 'numeric',
        numericFormat: { pattern: '$0,0.00' },
        headerClassName: 'htRight',
        className: 'htRight',
        width: 150,
      },
      {
        data: 'repairable',
        type: 'checkbox',
        headerClassName: 'htCenter',
        className: 'htCenter',
        width: 100,
      },
      {
        data: 'supplierName',
        type: 'text',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 150,
      },
      {
        data: 'restockDate',
        type: 'date',
        dateFormat: 'YYYY-MM-DD',
        headerClassName: 'htRight',
        className: 'htRight',
        width: 150,
      },
      {
        data: 'details',
        type: 'handsontable',
        width: 200,
        handsontable: {
          data: subData,
          colHeaders: ['Specification', 'Result', 'Date', 'Engineer'],
          autoColumnSize: true,
          columns: [{ type: 'text' }, { type: 'text' }, { type: 'text' }],
        },
      },
      {
        data: 'operationalStatus',
        type: 'dropdown',
        headerClassName: 'htLeft',
        className: 'htLeft',
        width: 180,
        source: [
          'Awaiting Parts',
          'In Maintenance',
          'Ready for Testing',
          'Operational',
          'Decommissioned',
        ],
        cells: function (row, col) {
          let cp = {};

          if (col == 15) {
            cp.renderer = operationalStatusRenderer;
          }

          return cp;
        },
      },
    ],
    licenseKey: 'non-commercial-and-evaluation',
  });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
