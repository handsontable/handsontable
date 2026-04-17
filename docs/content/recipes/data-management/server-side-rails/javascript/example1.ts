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
// Step 1: Type definitions for fetchRows parameters and the Order shape.
//
// Typing the sort / filter state and the row shape catches mismatched
// column keys at compile time -- the most common integration bug.
// ---------------------------------------------------------------------------
interface SortState {
  prop: string;
  order: 'asc' | 'desc';
}

interface FilterCondition {
  prop: string;
  value: string;
  condition: string;
}

interface FetchParams {
  page: number;
  pageSize: number;
  sort?: SortState;
  filters?: FilterCondition[];
}

interface PagedResponse<T> {
  rows: T[];
  totalRows: number;
}

// Snake_case here matches Rails' default JSON output. See the recipe for
// trade-offs between sticking with snake_case or forcing camelCase globally.
interface Order {
  id: number;
  order_number: string;
  customer: string;
  status: string;
  total: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Step 2: Build the request URL for fetchRows.
//
// - `pageSize` becomes `page_size` (Rails uses snake_case).
// - `sort` is split into flat `sort_prop` / `sort_order` query params.
// - Each filter entry becomes a filters[N][prop|value|condition] triplet.
//   Rails parses bracket-indexed params into a nested hash automatically.
// ---------------------------------------------------------------------------
function buildUrl(base: string, { page, pageSize, sort, filters }: FetchParams): string {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('page_size', String(pageSize));

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
// Step 3: Initialize Handsontable with the dataProvider plugin.
//
// `rowId: 'id'` tells dataProvider which field identifies each row.
// The Rails auto-increment primary key is used.
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:3000/api/orders';
const container = document.querySelector<HTMLElement>('#example1')!;

const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    // fetchRows is called on mount and whenever page, sort, or filters change.
    fetchRows: async (
      { page, pageSize, sort, filters }: FetchParams,
      { signal }: { signal: AbortSignal }
    ): Promise<PagedResponse<Order>> => {
      const url = buildUrl(API_BASE, { page, pageSize, sort, filters });
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      // Rails emits { rows, total_rows }. Remap `total_rows` to `totalRows`
      // before returning to dataProvider.
      const json = (await res.json()) as { rows: Order[]; total_rows: number };

      return { rows: json.rows, totalRows: json.total_rows };
    },

    // onRowsCreate receives new rows without ids. Return the server response
    // so dataProvider can replace placeholders with the ids assigned by Rails.
    onRowsCreate: async (rows: Partial<Order>[]): Promise<Order[]> => {
      const res = await fetch(`${API_BASE}/create_rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        throw new Error(`Create failed: ${res.status}`);
      }

      const json = (await res.json()) as { rows: Order[] };

      return json.rows;
    },

    // onRowsUpdate receives partial rows (id + changed fields only).
    // Wrap each row in { id, changes } so the Rails controller can separate
    // the primary key from the fields to update.
    onRowsUpdate: async (rows: Array<Partial<Order> & { id: number }>): Promise<void> => {
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

    // onRowsRemove receives an array of row ids to delete.
    // The Rails controller expects `{ row_ids: [...] }` in the request body.
    onRowsRemove: async (rowIds: number[]): Promise<void> => {
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

  pagination: { pageSize: 10 },
  columnSorting: true,
  filters: true,
  dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
  emptyDataState: true,
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
} as Handsontable.GridSettings);

export { hot };
