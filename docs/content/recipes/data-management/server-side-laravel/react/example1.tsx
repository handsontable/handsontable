import { useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

// Serializes fetchRows query parameters into a URL query string that Laravel
// reads via request()->input().
//
// Handsontable sends:
//   sort:    { prop: 'name', order: 'asc' }  or  null
//   filters: [{ prop: 'price', condition: { name: 'gt', args: [100] } }]  or  null
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

  if (filters) {
    filters.forEach((filter, i) => {
      params.set(`filters[${i}][prop]`, filter.prop);
      params.set(`filters[${i}][condition]`, filter.condition.name);
      const args = filter.condition.args ?? [];
      // Single-value conditions: contains, gt, eq, begins_with …
      if (args[0] != null) params.set(`filters[${i}][value]`, String(args[0]));
      // Range conditions: between, not_between
      if (args[1] != null) params.set(`filters[${i}][value2]`, String(args[1]));
    });
  }

  return `${base}?${params}`;
}

// Reads the CSRF token injected by Blade into <meta name="csrf-token">.
// For SPA routes protected by Sanctum, use cookie-based auth instead
// (see Step 9 in the recipe).
function csrfToken(): string {
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

const ExampleComponent = () => {
  // fetchRows is called on every page change, sort, and filter.
  // queryParameters: { page, pageSize, sort, filters }
  // signal: AbortSignal — pass it to fetch() so stale requests cancel
  // when the user sorts, filters, or changes pages quickly.
  const fetchRows = useCallback(
    async (
      params: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl('/api/products', params);
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Laravel returns: { data: [...], total: n }
      const json = await res.json() as { data: unknown[]; total: number };

      return { rows: json.data, totalRows: json.total };
    },
    []
  );

  // onRowsCreate fires when the user inserts rows from the context menu.
  // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
  const onRowsCreate = useCallback(async (payload: unknown): Promise<void> => {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(payload),
    });
  }, []);

  // onRowsUpdate fires after a cell edit, paste, or autofill batch.
  // rows is an array of { id, changes, rowData } objects.
  // Changes appear in the grid immediately (optimistic update) and roll back
  // if this callback throws or rejects.
  const onRowsUpdate = useCallback(async (rows: unknown): Promise<void> => {
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rows),
    });
  }, []);

  // onRowsRemove fires after the user confirms deletion.
  // rowIds is an array of stable row IDs (values of the rowId field).
  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rowIds),
    });
  }, []);

  const dataProvider = useMemo(
    () => ({
      // rowId must match the primary key field in your Laravel model.
      // Handsontable uses this value in every update and remove callback.
      rowId: 'id',
      fetchRows,
      onRowsCreate,
      onRowsUpdate,
      onRowsRemove,
    }),
    [fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove]
  );

  // beforeRowsMutation fires before any create, update, or remove operation.
  // Return false to cancel. Here it adds a confirm dialog before deletes.
  const beforeRowsMutation = useCallback((operation: string, payload: { rowsRemove: unknown[] }) => {
    if (operation === 'remove') {
      const count = payload.rowsRemove.length;
      // eslint-disable-next-line no-alert
      return window.confirm(`Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`);
    }
  }, []);

  return (
    <div>
      <HotTable
        dataProvider={dataProvider}
        // beforeRowsMutation fires before any create, update, or remove operation.
        beforeRowsMutation={beforeRowsMutation}
        // pagination: pageSize controls how many rows fetchRows requests per call.
        pagination={{ pageSize: 10 }}
        // columnSorting sends { prop, order } in queryParameters.sort.
        // Keep multiColumnSorting off -- it conflicts with dataProvider.
        columnSorting={true}
        // filters sends condition objects in queryParameters.filters.
        // The grid resets to page 1 automatically on each filter change.
        filters={true}
        // dropdownMenu shows the column header filter button.
        dropdownMenu={true}
        // contextMenu exposes "Insert row above / below" and "Remove row".
        contextMenu={true}
        // emptyDataState shows a loading overlay while fetchRows is in flight
        // and an empty-state overlay when the result set is empty.
        emptyDataState={true}
        // notification shows an error toast when fetchRows or any CRUD callback
        // rejects. Fetch failures include a Refetch button.
        notification={true}
        rowHeaders={true}
        colHeaders={['Name', 'SKU', 'Category', 'Price', 'Stock']}
        columns={[
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
        ]}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
