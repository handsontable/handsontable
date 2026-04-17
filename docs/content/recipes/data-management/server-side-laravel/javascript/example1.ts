import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

/**
 * Builds a URL with query parameters, skipping undefined and null values.
 *
 * The Laravel controller receives sort and filters as JSON-encoded strings
 * in individual query parameters -- simpler than bracket notation and easy
 * to decode with json_decode() in PHP.
 */
function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

// Get the DOM element where Handsontable will be rendered.
const container = document.querySelector<HTMLDivElement>('#example1')!;

const hot = new Handsontable(container, {
  // Column definitions map to the fields returned by the Laravel API.
  columns: [
    { data: 'id',         title: 'ID',       readOnly: true, width: 55 },
    { data: 'subject',    title: 'Subject',  width: 280 },
    { data: 'status',     title: 'Status',   type: 'dropdown', source: ['open', 'in-progress', 'resolved', 'closed'], width: 110 },
    { data: 'priority',   title: 'Priority', type: 'dropdown', source: ['low', 'medium', 'high', 'critical'], width: 90 },
    { data: 'assignee',   title: 'Assignee', width: 140 },
    { data: 'created_at', title: 'Created',  type: 'date', dateFormat: 'YYYY-MM-DD', width: 110 },
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 450,
  width: '100%',
  // Enable server-side column sorting.
  columnSorting: true,
  // Enable column filter dropdowns.
  filters: true,
  dropdownMenu: true,
  // Show 10 rows per page; the server returns the matching slice.
  pagination: { pageSize: 10 },
  // Show a placeholder message when no rows match the active filters.
  emptyDataState: true,
  // Show an error toast when a fetch or mutation request fails.
  notification: true,

  dataProvider: {
    // 'id' is the primary key returned by the Laravel API.
    rowId: 'id',

    /**
     * Fetches a page of tickets from the Laravel REST API.
     *
     * DataProviderQueryParameters provides page, pageSize, sort, and filters.
     * DataProviderFetchOptions provides the AbortSignal for request cancellation.
     */
    fetchRows: async (
      { page, pageSize, sort, filters }: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions,
    ) => {
      const url = buildUrl('/api/tickets', {
        page,
        pageSize,
        sort:    sort    ? JSON.stringify(sort)    : undefined,
        filters: filters ? JSON.stringify(filters) : undefined,
      });

      const res  = await fetch(url, { signal });
      const json = await res.json() as { rows: object[]; totalRows: number };

      return { rows: json.rows, totalRows: json.totalRows };
    },

    /**
     * Creates one or more tickets on the server.
     * Must return the created rows with server-assigned IDs.
     */
    onRowsCreate: async (payload) => {
      const res = await fetch('/api/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      return res.json();
    },

    /**
     * Sends changed cell values to the server.
     * Each element is { id, ...changes } -- only modified columns are included.
     */
    onRowsUpdate: async (rows) => {
      await fetch('/api/tickets', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(rows),
      });
    },

    /**
     * Sends an array of ticket IDs to delete.
     */
    onRowsRemove: async (rowIds) => {
      await fetch('/api/tickets', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(rowIds),
      });
    },
  },

  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);
