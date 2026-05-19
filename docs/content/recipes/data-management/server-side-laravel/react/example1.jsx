import { useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

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
function buildUrl(base, { page, pageSize, sort, filters }) {
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
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

const ExampleComponent = () => {
  const hotTableRef = useCallback((hotInstance) => {
    if (hotInstance) {
      // Store reference to the instance
      ExampleComponent._hotInstance = hotInstance;
    }
  }, []);

  // fetchRows is called on every page change, sort, and filter.
  // queryParameters: { page, pageSize, sort, filters }
  // signal: AbortSignal — pass it to fetch() so stale requests cancel
  // when the user sorts, filters, or changes pages quickly.
  const fetchRows = useCallback(async ({ page, pageSize, sort, filters }, { signal }) => {
    const url = buildUrl('/api/products', { page, pageSize, sort, filters });
    const res = await fetch(url, { signal });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Laravel returns: { data: [...], total: n }
    const json = await res.json();

    return { rows: json.data, totalRows: json.total };
  }, []);

  // onRowsCreate fires when the user inserts rows from the context menu.
  // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
  const onRowsCreate = useCallback(async (payload) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  // onRowsUpdate fires after a cell edit, paste, or autofill batch.
  // rows is an array of { id, changes, rowData } objects.
  // Changes appear in the grid immediately (optimistic update) and roll back
  // if this callback throws or rejects.
  const onRowsUpdate = useCallback(async (rows) => {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  // onRowsRemove fires after the user confirms deletion.
  // rowIds is an array of stable row IDs (values of the rowId field).
  const onRowsRemove = useCallback(async (rowIds) => {
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rowIds),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  // beforeRowsMutation is sync (checks for a strict `=== false` return), so
  // we cannot await an async prompt inline. Instead: cancel the original
  // attempt, show a notification with Delete/Cancel actions, and on Delete
  // re-issue the remove via the DataProvider API. A ref tracks confirmation.
  const removeConfirmedRef = { current: false };
  const beforeRowsMutation = useCallback((operation, payload) => {
    if (operation === 'remove' && !removeConfirmedRef.current) {
      const count = payload.rowsRemove.length;
      const hot = ExampleComponent._hotInstance;
      if (!hot) return false;

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
              removeConfirmedRef.current = true;
              hot.getPlugin('dataProvider').removeRows(payload.rowsRemove).finally(() => {
                removeConfirmedRef.current = false;
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
  }, []);

  return (
    <div>
      <HotTable
        ref={hotTableRef}
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
