import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

registerAllModules();

interface Filter {
  prop: string;
  conditions: { name: string; args: (string | number)[] }[];
}

// Serializes fetchRows query parameters into a URL query string that Symfony
// reads via $request->query->all().
//
// Handsontable sends:
//   sort:    { prop: 'name', order: 'asc' }  or  null
//   filters: [{ prop: 'price', conditions: [{ name: 'gt', args: [100] }] }]  or  null
//
// Symfony reads:
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

interface SymfonyResponse {
  data: object[];
  total: number;
}

const container = document.querySelector('#example1')!;

let removeConfirmed = false;
let totalRows = 0;

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  dataProvider: {
    // rowId must match the primary key field returned by the Symfony controller.
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

      // Symfony returns: { data: [...], total: n }
      const json = await res.json() as SymfonyResponse;
      totalRows = json.total;

      return { rows: json.data, totalRows: json.total };
    },

    // onRowsCreate fires when the user inserts rows from the context menu.
    // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
    onRowsCreate: async (payload) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // The server returns the newly created rows. Instead of triggering a full
      // refetch, we manually insert the row into the current page and update the
      // pagination counter. Throwing 'stop refetch' prevents the default refetch.
      const data = await res.json() as Record<string, unknown>[];
      const row = data[0];
      hot.getPlugin('notification').showMessage({
        variant: 'success',
        title: 'Row added',
        message: `Created: ${row['sku']} (id: ${row['id']})`,
        duration: 3000,
      });

      const pageSize = (hot.getSettings() as { pagination?: { pageSize?: number } }).pagination?.pageSize ?? 10;
      const rows = hot.getSourceData() as Record<string, unknown>[];
      const typedPayload = payload as { referenceRowId: unknown; position: string };
      const index = rows.findIndex(r => r['id'] === typedPayload.referenceRowId);
      const insertAt = index >= 0 ? index + (typedPayload.position === 'above' ? 0 : 1) : rows.length;
      rows.splice(insertAt, 0, row);
      hot.loadData(rows.slice(0, pageSize));
      totalRows += 1;
      hot.runHooks('afterDataProviderFetch', { queryParameters: {}, totalRows });
      throw new Error('stop refetch');
    },

    // onRowsUpdate fires after a cell edit, paste, or autofill batch.
    // rows is an array of { id, changes, rowData } objects.
    // Changes appear in the grid immediately (optimistic update) and roll back
    // if this callback throws or rejects.
    onRowsUpdate: async (rows) => {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },

    // onRowsRemove fires after the user confirms deletion.
    // rowIds is an array of stable row IDs (values of the rowId field).
    onRowsRemove: async (rowIds) => {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowIds),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  width: '100%',
  height: 'auto',
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
    { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
    { data: 'stock', type: 'numeric' },
  ],
  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);

document.getElementById('btn-filter-empty')!.addEventListener('click', () => {
  const filters = hot.getPlugin('filters');
  filters.clearConditions();
  filters.addCondition(2, 'eq', ['Electronics']);
  filters.filter();
});

document.getElementById('btn-clear-filters')!.addEventListener('click', () => {
  const filters = hot.getPlugin('filters');
  filters.clearConditions();
  filters.filter();
});

export default hot;
