import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

registerAllModules();

interface Filter {
  prop: string;
  conditions: { name: string; args: (string | number)[] }[];
}

// Serializes fetchRows query parameters into a URL query string that Laravel
// reads via request()->input().
//
// Handsontable sends:
//   sort:    { prop: 'name', order: 'asc' }  or  null
//   filters: [{ prop: 'price', conditions: [{ name: 'gt', args: [100] }] }]  or  null
//
// Laravel reads:
//   sort[prop], sort[order]
//   filters[0][prop], filters[0][condition], filters[0][value], filters[0][value2]
function buildUrl(base: string, { page, pageSize, sort, filters }: DataProviderQueryParameters): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (sort) {
    params.set('sort[prop]', sort.prop);
    params.set('sort[order]', sort.order);
  }

  if (filters?.length) {
    let idx = 0;
    (filters as Filter[]).forEach(({ prop, conditions }) => {
      (conditions || []).forEach(({ name, args }) => {
        if (!name) return;
        params.set(`filters[${idx}][prop]`, prop);
        params.set(`filters[${idx}][condition]`, name);
        const a = args ?? [];
        // Single-value conditions: contains, gt, eq, begins_with …
        if (a[0] != null) params.set(`filters[${idx}][value]`, String(a[0]));
        // Range conditions: between, not_between
        if (a[1] != null) params.set(`filters[${idx}][value2]`, String(a[1]));
        idx++;
      });
    });
  }

  return `${base}?${params}`;
}

// For Blade-rendered pages, inject via <meta name="csrf-token" content="{{ csrf_token() }}">.
// For this standalone SPA the API routes are stateless so the header is a no-op,
// but it's kept here so the code mirrors the recipe exactly.
function csrfToken(): string {
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

interface LaravelResponse {
  data: object[];
  total: number;
}

const container = document.querySelector('#example1')!;

let removeConfirmed = false;

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  dataProvider: {
    // rowId must match the primary key field in your Laravel model.
    // Handsontable uses this value in every update and remove callback.
    rowId: 'id',

    // fetchRows is called on every page change, sort, and filter.
    // queryParameters: { page, pageSize, sort, filters }
    // signal: AbortSignal — pass it to fetch() so stale requests cancel
    // when the user sorts, filters, or changes pages quickly.
    fetchRows: async (queryParameters, { signal }) => {
      const url = buildUrl('/api/products', queryParameters);
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Laravel returns: { data: [...], total: n }
      const json = await res.json() as LaravelResponse;

      return { rows: json.data, totalRows: json.total };
    },

    // onRowsCreate fires when the user inserts rows from the context menu.
    // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
    onRowsCreate: async (payload) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { sku: string; id: number }[];
      const row = data[0];
      hot.getPlugin('notification').showMessage({
        variant: 'success',
        title: 'Row added',
        message: `Created: ${row.sku} (id: ${row.id})`,
        duration: 3000,
      });
      return data;
    },

    // onRowsUpdate fires after a cell edit, paste, or autofill batch.
    // rows is an array of { id, changes, rowData } objects.
    // Changes appear in the grid immediately (optimistic update) and roll back
    // if this callback throws or rejects.
    onRowsUpdate: async (rows) => {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },

    // onRowsRemove fires after the user confirms deletion.
    // rowIds is an array of stable row IDs (values of the rowId field).
    onRowsRemove: async (rowIds) => {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify(rowIds),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ids = rowIds as unknown[];
      hot.getPlugin('notification').showMessage({
        variant: 'success',
        title: 'Rows deleted',
        message: `Deleted ${ids.length} row${ids.length !== 1 ? 's' : ''}`,
        duration: 3000,
      });
    },
  },

  // beforeRowsMutation is sync (checks for a strict `=== false` return), so
  // we cannot await an async prompt inline. Instead: cancel the original
  // attempt, show a notification with Delete/Cancel actions, and on Delete
  // re-issue the remove via the DataProvider API. The flag lets the second
  // pass through without re-prompting.
  beforeRowsMutation(operation, payload) {
    if (operation === 'remove' && !removeConfirmed) {
      const rowsRemove = (payload as { rowsRemove: unknown[] }).rowsRemove;
      const count = rowsRemove.length;
      const notification = hot.getPlugin('notification');
      const id = notification.showMessage({
        variant: 'warning',
        title: 'Delete rows',
        message: `Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`,
        duration: 0,
        actions: [
          {
            label: 'Delete',
            type: 'primary',
            callback: () => {
              notification.hide(id);
              removeConfirmed = true;
              hot.getPlugin('dataProvider').removeRows(rowsRemove).finally(() => {
                removeConfirmed = false;
              });
            },
          },
          {
            label: 'Cancel',
            type: 'secondary',
            callback: () => notification.hide(id),
          },
        ],
      });
      return false;
    }
  },

  // pagination: pageSize controls how many rows fetchRows requests per call.
  pagination: { pageSize: 10 },

  // columnSorting sends { prop, order } in queryParameters.sort.
  // Keep multiColumnSorting off — it conflicts with dataProvider.
  columnSorting: true,

  // filters sends condition objects in queryParameters.filters.
  // The grid resets to page 1 automatically on each filter change.
  filters: true,

  // dropdownMenu shows the column header filter button.
  dropdownMenu: true,

  // contextMenu exposes "Insert row above / below" and "Remove row".
  contextMenu: true,

  // emptyDataState shows a loading overlay while fetchRows is in flight
  // and an empty-state overlay when the result set is empty.
  emptyDataState: true,

  // notification shows an error toast when fetchRows or any CRUD callback
  // rejects. Fetch failures include a Refetch button.
  notification: true,

  rowHeaders: true,
  colHeaders: ['Name', 'SKU', 'Category', 'Price', 'Stock'],
  columns: [
    { data: 'name', type: 'text' },
    // SKU is generated server-side, so it is read-only in the grid.
    { data: 'sku', type: 'text', readOnly: true },
    {
      data: 'category',
      type: 'dropdown',
      source: ['Electronics', 'Accessories', 'Storage', 'Networking', 'Peripherals'],
    },
    { data: 'price', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    { data: 'stock', type: 'numeric' },
  ],
  width: '100%',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);

export default hot;
