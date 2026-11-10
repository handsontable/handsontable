import { forwardRef, memo } from 'react';
import { HotTable, type HotTableRef } from '@handsontable/react-wrapper';
import type { GridSettings } from 'handsontable/settings';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

import { fetchRows, onRowsCreate, onRowsRemove, onRowsUpdate } from './ordersProvider';

registerAllModules();

// Defined once at module level. The wrapper passes changed props to updateSettings(), and a
// new dataProvider object makes the plugin refetch. Inline literals would refetch on every
// parent render, and since each fetch updates the parent's stats, the grid would never settle.
const DATA_PROVIDER: GridSettings['dataProvider'] = {
  rowId: 'id',
  fetchRows,
  onRowsCreate,
  onRowsUpdate,
  onRowsRemove,
};

const COL_HEADERS = ['ID', 'Order', 'Customer', 'Region', 'Product', 'Qty', 'Unit price', 'Status', 'Order date'];

const COLUMNS: GridSettings['columns'] = [
  { data: 'id', type: 'numeric', readOnly: true },
  { data: 'order_no', type: 'text', readOnly: true, width: 130 },
  { data: 'customer', type: 'text', width: 170 },
  { data: 'region', type: 'text', width: 130 },
  { data: 'product', type: 'text', width: 120 },
  { data: 'quantity', type: 'numeric', width: 80 },
  { data: 'unit_price', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD' }, width: 110 },
  { data: 'status', type: 'text', width: 110 },
  { data: 'order_date', type: 'text', width: 110 },
];

const HIDDEN_COLUMNS = { columns: [0] };
const PAGINATION = { pageSize: 50 };
const DROPDOWN_MENU = ['filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_action_bar'];
const CONTEXT_MENU = ['row_above', 'row_below', 'remove_row'];

// memo keeps parent re-renders (the stats bar updates after every fetch) away from HotTable.
const OrdersGrid = memo(forwardRef<HotTableRef>((_, ref) => (
  <HotTable
    // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
    ref={ref}
    themeName="ht-theme-main"
    dataProvider={DATA_PROVIDER}
    colHeaders={COL_HEADERS}
    columns={COLUMNS}
    hiddenColumns={HIDDEN_COLUMNS}
    // Counts hidden columns too: id (hidden), order_no and customer.
    fixedColumnsStart={3}
    pagination={PAGINATION}
    // Single-column, server-driven sort. multiColumnSorting would disable dataProvider.
    columnSorting={true}
    filters={true}
    dropdownMenu={DROPDOWN_MENU}
    notification={true}
    emptyDataState={true}
    contextMenu={CONTEXT_MENU}
    rowHeaders={true}
    height={620}
    stretchH="all"
  />
)));

export default OrdersGrid;
