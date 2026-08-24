import { useRef, useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// Serializes fetchRows query parameters into a URL query string that Symfony
// reads via $request->query->all().
//
// Handsontable sends:
//   sort:    { prop: 'name', order: 'asc' }  or  null
//   filters: [{ prop: 'price', operation: 'conjunction',
//               conditions: [{ name: 'gt', args: [100] }] }]  or  null
//
// Symfony reads:
//   sort[prop], sort[order]
//   filters[0][prop], filters[0][condition], filters[0][value], filters[0][value2]
//
// Each DataProviderFilterColumn can have multiple conditions (e.g. between),
// so we flatten them: one entry per condition, incrementing the index.
function buildUrl(base, { page, pageSize, sort, filters }) {
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

    filters.forEach(({ prop, conditions }) => {
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

const ExampleComponent = () => {
  // hotRef.current.hotInstance is the underlying Handsontable instance.
  const hotRef = useRef(null);

  // beforeRowsMutation is sync, so we use a ref (not state) to track whether
  // the user already confirmed deletion. A plain { current: false } object
  // would be recreated on every render — useRef persists across renders.
  const removeConfirmedRef = useRef(false);

  // totalRows is updated by fetchRows and read by onRowsCreate to keep the
  // pagination counter in sync after a manual row insertion.
  const totalRowsRef = useRef(0);

  // fetchRows is called on every page change, sort, and filter.
  // signal: AbortSignal — pass it to fetch() so stale requests cancel
  // when the user sorts, filters, or changes pages quickly.
  const fetchRows = useCallback(async ({ page, pageSize, sort, filters }, { signal }) => {
    const url = buildUrl('/api/products', { page, pageSize, sort, filters });
    const res = await fetch(url, { signal });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Symfony returns: { data: [...], total: n }
    const json = await res.json();
    totalRowsRef.current = json.total;

    return { rows: json.data, totalRows: json.total };
  }, []);

  // onRowsCreate fires when the user inserts rows from the context menu.
  // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
  const onRowsCreate = useCallback(async (payload) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // The server returns the newly created rows. Instead of triggering a full
    // refetch, we manually insert the row into the current page and update the
    // pagination counter. Throwing 'stop refetch' prevents the default refetch.
    const data = await res.json();
    const row = data[0];
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    hot.getPlugin('notification').showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${row.sku} (id: ${row.id})`,
      duration: 3000,
    });

    const pageSize = hot.getSettings().pagination?.pageSize ?? 10;
    const rows = hot.getSourceData();
    const index = rows.findIndex(r => r.id === payload.referenceRowId);
    const insertAt = index >= 0 ? index + (payload.position === 'above' ? 0 : 1) : rows.length;
    rows.splice(insertAt, 0, row);
    hot.loadData(rows.slice(0, pageSize));
    totalRowsRef.current += 1;
    hot.runHooks('afterDataProviderFetch', { queryParameters: {}, totalRows: totalRowsRef.current });
    throw new Error('stop refetch');
  }, []);

  // onRowsUpdate fires after a cell edit, paste, or autofill batch.
  // rows is an array of { id, changes, rowData } objects.
  // Changes appear in the grid immediately (optimistic update) and roll back
  // if this callback throws or rejects.
  const onRowsUpdate = useCallback(async (rows) => {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  // onRowsRemove fires after the user confirms deletion.
  // rowIds is an array of stable row IDs (values of the rowId field).
  const onRowsRemove = useCallback(async (rowIds) => {
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  const dataProvider = useMemo(
    () => ({
      // rowId must match the primary key field returned by the Symfony controller.
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
  // re-issue the remove via the DataProvider API. The ref lets the second
  // pass through without re-prompting.
  const beforeRowsMutation = useCallback((operation, payload) => {
    if (operation === 'remove' && !removeConfirmedRef.current) {
      const count = payload.rowsRemove.length;
      const hot = hotRef.current?.hotInstance;
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

  const filterElectronics = useCallback(() => {
    const filters = hotRef.current?.hotInstance?.getPlugin('filters');
    if (!filters) return;
    filters.clearConditions();
    filters.addCondition(2, 'eq', ['Electronics']);
    filters.filter();
  }, []);

  const clearFilters = useCallback(() => {
    const filters = hotRef.current?.hotInstance?.getPlugin('filters');
    if (!filters) return;
    filters.clearConditions();
    filters.filter();
  }, []);

  return (
    <div>
      <div className="toolbar">
        <button onClick={filterElectronics}>Show Electronics</button>
        <button onClick={clearFilters}>Clear filters</button>
      </div>
      <div id="example1">
        <HotTable
          ref={hotRef}
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
          width="100%"
          height="auto"
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
            { data: 'price', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
            { data: 'stock', type: 'numeric' },
          ]}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    </div>
  );
};

export default ExampleComponent;
