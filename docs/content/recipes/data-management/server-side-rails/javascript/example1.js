import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  DataProvider,
  DropdownMenu,
  Filters,
  ColumnSorting,
  Pagination,
  EmptyDataState,
  Notification,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/cellTypes';

registerPlugin(DataProvider);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerPlugin(ColumnSorting);
registerPlugin(Pagination);
registerPlugin(EmptyDataState);
registerPlugin(Notification);
registerAllCellTypes();

// ---------------------------------------------------------------------------
// Step 1: Build the request URL for fetchRows.
//
// Handsontable's dataProvider calls fetchRows with { page, pageSize, sort,
// filters }. This helper converts those values into the query-string shape
// the Rails controller expects:
//
// - `pageSize` becomes `page_size` (Rails and kaminari use snake_case).
// - `sort` is split into two flat params, `sort_prop` and `sort_order`.
//   The controller reads them directly in apply_sort.
// - Each filter entry becomes a filters[N][prop|value|condition] triplet.
//   Rails auto-parses the bracket notation into a nested hash.
// ---------------------------------------------------------------------------
function buildUrl(base, { page, pageSize, sort, filters }) {
  const params = new URLSearchParams();

  params.set('page', page);
  params.set('page_size', pageSize);

  if (sort?.prop) {
    params.set('sort_prop', sort.prop);
    params.set('sort_order', sort.order ?? 'asc');
  }

  if (filters?.length) {
    filters.forEach(({ prop, value, condition }, i) => {
      params.set(`filters[${i}][prop]`, prop);
      params.set(`filters[${i}][value]`, value);
      params.set(`filters[${i}][condition]`, condition);
    });
  }

  return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Step 2: Initialize Handsontable with the dataProvider plugin.
//
// `rowId: 'id'` tells dataProvider which field identifies each row.
// The Rails auto-increment primary key is used.
//
// Every callback receives the signal from the internal AbortController so
// in-flight requests are cancelled when the user sorts or filters again
// before the previous response arrives.
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:3000/api/orders';
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    // fetchRows is called on mount and whenever page, sort, or filters change.
    fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
      const url = buildUrl(API_BASE, { page, pageSize, sort, filters });
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      const json = await res.json();

      // Rails emits snake_case keys by default, so remap `total_rows` to
      // `totalRows` before returning to dataProvider. Alternatively you can
      // configure Rails to emit camelCase globally -- see the recipe for
      // the trade-offs of each approach.
      return { rows: json.rows, totalRows: json.total_rows };
    },

    // onRowsCreate receives new rows without ids. Return the server response
    // so dataProvider can replace placeholders with the ids assigned by Rails.
    onRowsCreate: async (rows) => {
      const res = await fetch(`${API_BASE}/create_rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        throw new Error(`Create failed: ${res.status}`);
      }

      const json = await res.json();

      return json.rows;
    },

    // onRowsUpdate receives partial rows. Wrap each row in { id, changes }
    // so the Rails controller can distinguish the primary key from the
    // fields to update.
    onRowsUpdate: async (rows) => {
      const res = await fetch(`${API_BASE}/update_rows`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rows.map((row) => ({ id: row.id, changes: row })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`);
      }
    },

    // onRowsRemove receives an array of row ids. The Rails controller expects
    // `{ row_ids: [...] }` in the request body.
    onRowsRemove: async (rowIds) => {
      const res = await fetch(`${API_BASE}/remove_rows`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row_ids: rowIds }),
      });

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }
    },
  },

  // Show 10 rows per page; users can change this via the pagination UI.
  pagination: { pageSize: 10 },

  // Enable server-side column sorting. dataProvider passes the sort state
  // to fetchRows automatically.
  columnSorting: true,

  // Enable the column filter UI. dataProvider passes active conditions
  // to fetchRows automatically.
  filters: true,
  dropdownMenu: ['filter_by_condition', 'filter_action_bar'],

  // Show a friendly illustration when the server returns zero rows
  // (for example, when a filter matches nothing).
  emptyDataState: true,

  // Show automatic error toasts when fetchRows or a mutation callback throws.
  // Fetch failures include a Refetch action.
  notification: true,

  colHeaders: ['Order #', 'Customer', 'Status', 'Total', 'Created'],
  columns: [
    { data: 'order_number', type: 'text' },
    { data: 'customer', type: 'text' },
    { data: 'status', type: 'text' },
    { data: 'total', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
    { data: 'created_at', type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
  ],

  rowHeaders: true,
  height: 400,
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// eslint-disable-next-line no-unused-vars
export { hot };
