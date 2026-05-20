import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

/**
 * Converts Handsontable's DataProviderQueryParameters into a URL query string
 * that the NestJS backend can parse with @Query() and class-transformer.
 *
 * Handsontable passes `params` to fetchRows every time the page, sort, or
 * filters change. The shape is:
 *
 *   {
 *     page: 1,
 *     pageSize: 10,
 *     sort: { column: 'status', order: 'asc' } | undefined,
 *     filters: [{ prop: 'status', condition: 'eq', value: ['open'] }] | undefined,
 *   }
 *
 * NestJS expects nested objects as bracket notation in the query string:
 *   sort[column]=status&sort[order]=asc
 *   filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][]=open
 */
function buildUrl(base: string, params: DataProviderQueryParameters): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.column as string);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters && params.filters.length > 0) {
    params.filters.forEach((filter, i) => {
      query.set(`filters[${i}][prop]`, filter.prop as string);
      query.set(`filters[${i}][condition]`, filter.condition);

      filter.value.forEach((v, j) => {
        query.set(`filters[${i}][value][${j}]`, String(v));
      });
    });
  }

  return `${base}?${query.toString()}`;
}

// ---------------------------------------------------------------------------
// Handsontable configuration
// ---------------------------------------------------------------------------

const container = document.querySelector<HTMLDivElement>('#example1')!;
const statusLabel = document.querySelector<HTMLSpanElement>('#status-label')!;

const hotOptions: Handsontable.GridSettings = {
  /**
   * dataProvider wires Handsontable to a remote data source.
   *
   * rowId tells the grid which field uniquely identifies each row. This is
   * required for CRUD operations so the grid can track which rows were added,
   * changed, or removed.
   */
  dataProvider: {
    rowId: 'id',

    /**
     * fetchRows is called by the grid whenever the page, sort, or filter
     * changes. The `params` object contains the current pagination state,
     * active sort, and active filter conditions.
     *
     * The `signal` from DataProviderFetchOptions is an AbortSignal -- pass it
     * to fetch() so in-flight requests are cancelled when the user navigates
     * away or triggers a new fetch before the previous one finishes.
     *
     * Return { rows, totalRows } so the grid can calculate the total number
     * of pages.
     */
    fetchRows: async (
      params: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions,
    ) => {
      const url = buildUrl('http://localhost:3000/tickets', params);
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      return res.json() as Promise<{ rows: object[]; totalRows: number }>;
    },

    /**
     * onRowsCreate is called after the user adds one or more rows.
     * `payload` contains the new row data keyed by the column `data` property.
     * The server must return the created rows (including generated IDs).
     */
    onRowsCreate: async (payload) => {
      const res = await fetch('http://localhost:3000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Create failed: ${res.status}`);
      }

      return res.json();
    },

    /**
     * onRowsUpdate is called after the user edits cells and commits changes.
     * `rows` is an array of partial row objects, each including the row ID
     * and only the changed column values.
     */
    onRowsUpdate: async (rows) => {
      const res = await fetch('http://localhost:3000/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });

      if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`);
      }
    },

    /**
     * onRowsRemove is called after the user deletes rows.
     * `rowIds` is an array of the string IDs of the deleted rows.
     */
    onRowsRemove: async (rowIds) => {
      const res = await fetch('http://localhost:3000/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowIds),
      });

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }
    },
  },

  /**
   * pagination enables server-side paging. The grid sends the page number
   * and page size as part of the fetchRows params object.
   */
  pagination: { pageSize: 5 },

  /** columnSorting sends a sort descriptor in the fetchRows params. */
  columnSorting: true,

  /** filters sends an array of filter conditions in the fetchRows params. */
  filters: true,
  dropdownMenu: true,

  /**
   * emptyDataState shows a loading overlay while fetchRows is in flight
   * and an empty-state message when the server returns zero rows.
   */
  emptyDataState: true,

  /**
   * notification: true enables automatic error toasts when fetchRows,
   * onRowsCreate, onRowsUpdate, or onRowsRemove throw or reject. Fetch
   * failures also display a Refetch button in the toast.
   */
  notification: true,

  colHeaders: ['ID', 'Subject', 'Status', 'Priority', 'Assignee', 'Created'],
  columns: [
    { data: 'id', type: 'text', readOnly: true, width: 50 },
    { data: 'subject', type: 'text', width: 280 },
    {
      data: 'status',
      type: 'dropdown',
      source: ['open', 'in-progress', 'resolved', 'closed'],
      width: 110,
    },
    {
      data: 'priority',
      type: 'dropdown',
      source: ['low', 'medium', 'high', 'critical'],
      width: 90,
    },
    { data: 'assignee', type: 'text', width: 140 },
    { data: 'createdAt', type: 'date', dateFormat: 'YYYY-MM-DD', width: 110 },
  ],

  rowHeaders: true,
  height: 360,
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',

  /**
   * afterDataProviderFetch fires after every successful fetchRows response.
   * Use it to update UI outside the grid (e.g., a status label or record count).
   */
  afterDataProviderFetch(result: { rows: object[]; totalRows: number }) {
    if (statusLabel) {
      statusLabel.textContent = `${result.totalRows} tickets total`;
    }
  },
};

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
