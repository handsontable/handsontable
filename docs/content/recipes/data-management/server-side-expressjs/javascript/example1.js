import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

/**
 * Converts Handsontable's DataProviderQueryParameters into a URL query string
 * that the Express backend can parse via Zod's safeParse.
 *
 * Handsontable passes `params` to fetchRows every time the page, sort, or
 * filters change. The shape is:
 *
 *   {
 *     page: 1,
 *     pageSize: 10,
 *     sort: { prop: 'status', order: 'asc' } | undefined,
 *     filters: [
 *       { prop: 'status', operation: 'conjunction',
 *         conditions: [{ name: 'eq', args: ['open'] }] }
 *     ] | undefined,
 *   }
 *
 * Express with Zod expects nested objects as bracket notation in the query string:
 *   sort[column]=status&sort[order]=asc
 *   filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
 *
 * Each DataProviderFilterColumn can have multiple conditions (e.g. between),
 * so we flatten them: one entry per condition, incrementing the index.
 */
function buildUrl(params) {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.prop);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters && params.filters.length > 0) {
    let idx = 0;

    params.filters.forEach((filter) => {
      filter.conditions.forEach((cond) => {
        query.set(`filters[${idx}][prop]`, filter.prop);
        query.set(`filters[${idx}][condition]`, cond.name);

        cond.args.forEach((arg, j) => {
          query.set(`filters[${idx}][value][${j}]`, String(arg));
        });

        idx++;
      });
    });
  }

  return `/tickets?${query.toString()}`;
}

// ---------------------------------------------------------------------------
// Handsontable configuration
// ---------------------------------------------------------------------------

const container = document.querySelector('#example1');
const statusLabel = document.querySelector('#status-label');

const hotOptions = {
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
     * The `signal` from the second argument is an AbortSignal -- pass it to
     * fetch() so in-flight requests are cancelled when the user navigates away
     * or triggers a new fetch before the previous one finishes.
     *
     * Return { rows, totalRows } so the grid can calculate the total number
     * of pages.
     */
    fetchRows: async (params, { signal }) => {
      const res = await fetch(buildUrl(params), { signal });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      return res.json();
    },

    /**
     * onRowsCreate receives { rowsAmount } -- the number of rows to add.
     * Build default row objects for each new row, POST them to the server,
     * and return the created rows with their server-generated UUIDs so the
     * grid can update its row map.
     */
    onRowsCreate: async ({ rowsAmount }) => {
      const rows = Array.from({ length: rowsAmount }, () => ({
        subject: '',
        status: 'open',
        priority: 'medium',
        assignee: '',
        createdAt: new Date().toISOString().slice(0, 10),
      }));

      const res = await fetch('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });

      if (!res.ok) {
        throw new Error(`Create failed: ${res.status}`);
      }

      return res.json();
    },

    /**
     * onRowsUpdate receives an array of { id, changes } objects.
     * Flatten each entry into { id, ...changes } before sending so the
     * server receives a plain object with only the changed fields.
     */
    onRowsUpdate: async (rows) => {
      const payload = rows.map(({ id, changes }) => ({ id, ...changes }));
      const res = await fetch('/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      const res = await fetch('/tickets', {
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
  // contextMenu exposes "Insert row above / below" and "Remove row".
  contextMenu: true,

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
    { data: 'createdAt', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }, width: 110 },
  ],

  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',

  /**
   * afterDataProviderFetch fires after every successful fetchRows response.
   * Use it to update UI outside the grid (e.g., a status label or record count).
   */
  afterDataProviderFetch(result) {
    if (statusLabel) {
      statusLabel.textContent = `${result.totalRows} tickets total`;
    }
  },
};

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
