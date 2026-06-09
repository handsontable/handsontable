import { useRef, useCallback, useMemo } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
  RowMutationPayload,
  RowMutationRemovePayload,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

// eslint-disable-next-line no-unused-vars
const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const removeConfirmedRef = useRef(false);

  const fetchRows = useCallback(
    async (
      { page, pageSize, sort, filters }: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl('/api/products', {
        page,
        pageSize,
        sortProp: sort?.prop,
        sortOrder: sort?.order,
        filters: filters ? JSON.stringify(filters) : undefined,
      });

      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { rows: unknown[]; totalRows: number };

      return { rows: json.rows, totalRows: json.totalRows };
    },
    []
  );

  const onRowsCreate = useCallback(async (payload: unknown): Promise<unknown[]> => {
    const res = await fetch('/api/products/create-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as Array<{ id: number }>;
    const info = data.map(r => `(id: ${r.id})`).join(', ');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hotRef.current?.hotInstance?.getPlugin('notification') as any)?.showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${info}`,
      duration: 3000,
    });
    return data;
  }, []);

  const onRowsUpdate = useCallback(async (rows: unknown): Promise<void> => {
    const res = await fetch('/api/products/update-rows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    const res = await fetch('/api/products/remove-rows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  const dataProvider = useMemo(
    () => ({
      rowId: 'id',
      fetchRows,
      onRowsCreate,
      onRowsUpdate,
      onRowsRemove,
    }),
    [fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove]
  );

  // beforeRowsMutation is sync (checks for a strict `=== false` return), so
  // we can't await an async prompt inline. Instead: cancel the original
  // attempt, show a notification with Delete/Cancel actions, and on Delete
  // re-issue the remove via the DataProvider API. The flag lets the second
  // pass through without re-prompting.
  const beforeRowsMutation = useCallback(
    (operation: 'create' | 'update' | 'remove', payload: RowMutationPayload): false | void => {
      if (operation === 'remove' && !removeConfirmedRef.current) {
        const { rowsRemove } = payload as RowMutationRemovePayload;
        const hot = hotRef.current?.hotInstance;
        if (!hot) return false;

        const count = rowsRemove.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notification = (hot.getPlugin('notification') as any);
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (hot.getPlugin('dataProvider') as any)
                  .removeRows(rowsRemove)
                  .finally(() => {
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
    },
    []
  );

  return (
    <div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <HotTable
        ref={hotRef}
        dataProvider={dataProvider}
        beforeRowsMutation={beforeRowsMutation as any}
        columns={[
          { data: 'id', title: 'ID', readOnly: true, width: 60 },
          { data: 'name', title: 'Name', width: 200 },
          { data: 'sku', title: 'SKU', width: 120 },
          { data: 'category', title: 'Category', width: 130 },
          {
            data: 'price',
            title: 'Price',
            type: 'numeric',
            numericFormat: { pattern: '0,0.00', culture: 'en-US' },
            width: 100,
          },
          { data: 'stock', title: 'Stock', type: 'numeric', width: 80 },
        ]}
        colHeaders={true}
        rowHeaders={true}
        height={450}
        width="100%"
        columnSorting={true}
        filters={true}
        dropdownMenu={true}
        contextMenu={true}
        pagination={{ pageSize: 10 }}
        emptyDataState={true}
        notification={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
