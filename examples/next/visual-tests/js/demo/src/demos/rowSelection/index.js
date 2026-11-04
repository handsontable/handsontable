import Handsontable from 'handsontable/base';
import { registerPlugin, RowSelection, CheckboxHeader } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType, NumericCellType } from 'handsontable/cellTypes';
import { getThemeNameFromURL } from '../../utils';
import { products, stock } from './data';

/**
 * Appends one labeled grid container to the layout.
 */
function createGridContainer(layout, id, caption) {
  const wrapper = document.createElement('div');
  const label = document.createElement('p');
  const container = document.createElement('div');

  label.textContent = caption;
  label.style.margin = '0 0 8px';
  container.id = id;
  wrapper.append(label, container);
  layout.appendChild(wrapper);

  return container;
}

/**
 * Four small grids, one per row selection layout, each left in a different header checkbox state:
 * - `rowSelectionMixed`: checkboxes next to the row numbers, two rows selected (mixed), one row disabled.
 * - `rowSelectionUnchecked`: `rowHeaders: false`, nothing selected (unchecked).
 * - `rowSelectionFirstColumn`: `checkboxLocation: 'firstColumn'` in an empty column, every row selected (checked).
 * - `checkboxHeaderMixed`: a `type: 'checkbox'` column with `headerCheckbox: true`, some values checked (mixed).
 */
export function init() {
  registerPlugin(RowSelection);
  registerPlugin(CheckboxHeader);
  registerCellType(CheckboxCellType);
  registerCellType(NumericCellType);

  const root = document.getElementById('root');
  const layout = document.createElement('div');

  layout.style.display = 'grid';
  layout.style.gridTemplateColumns = 'repeat(2, max-content)';
  layout.style.gap = '24px 32px';
  layout.style.padding = '8px';
  root.appendChild(layout);

  const common = {
    themeName: getThemeNameFromURL(),
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
  };
  const productColumns = [
    { data: 'sku', width: 110 },
    { data: 'product', width: 220 },
    { data: 'supplier', width: 190 },
  ];

  const mixed = new Handsontable(createGridContainer(layout, 'rowSelectionMixed', 'Row headers, mixed'), {
    ...common,
    data: structuredClone(products),
    columns: productColumns,
    colHeaders: ['SKU', 'Product', 'Supplier'],
    rowHeaders: true,
    rowSelection: {
      isRowSelectable: rowData => rowData.status !== 'Discontinued',
    },
  });

  mixed.getPlugin('rowSelection').selectRows([0, 2]);

  new Handsontable(createGridContainer(layout, 'rowSelectionUnchecked', 'Checkbox column only, unchecked'), {
    ...common,
    data: structuredClone(products),
    columns: productColumns,
    colHeaders: ['SKU', 'Product', 'Supplier'],
    rowHeaders: false,
    rowSelection: true,
  });

  const firstColumn = new Handsontable(
    createGridContainer(layout, 'rowSelectionFirstColumn', 'First column, checked'),
    {
      ...common,
      data: structuredClone(products),
      columns: [
        // an empty column that holds only the checkboxes
        { data: 'rowSelection', editor: false, width: 44, className: 'htCenter' },
        ...productColumns,
      ],
      colHeaders: ['', 'SKU', 'Product', 'Supplier'],
      rowHeaders: false,
      rowSelection: {
        checkboxLocation: 'firstColumn',
      },
    }
  );

  firstColumn.getPlugin('rowSelection').selectAll();

  new Handsontable(createGridContainer(layout, 'checkboxHeaderMixed', 'Checkbox column header, mixed'), {
    ...common,
    data: structuredClone(stock),
    columns: [
      { data: 'inStock', type: 'checkbox', headerCheckbox: true, width: 110 },
      { data: 'product', width: 220 },
      { data: 'warehouse', width: 110 },
      { data: 'quantity', type: 'numeric', width: 80 },
    ],
    colHeaders: ['In stock', 'Product', 'Warehouse', 'Quantity'],
    rowHeaders: true,
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
