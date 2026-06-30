import { useCallback, useMemo, useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
  RowsCreatePayload,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

// ---------------------------------------------------------------------------
// Step 1: Read Django's CSRF token from the cookie.
// ---------------------------------------------------------------------------
function getCsrfToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
    ?.split('=')[1];
}

// ---------------------------------------------------------------------------
// Step 2: Build the request URL for fetchRows.
//
// - `filters` is a DataProviderFilterColumn[] array -- pass it as a JSON
//   string so Django can parse the full nested structure with json.loads().
// ---------------------------------------------------------------------------
const API_BASE = '/api/employees/';

function buildUrl({ page, pageSize, sort, filters }: DataProviderQueryParameters): string {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  if (sort?.prop) {
    params.set('sort[prop]', sort.prop);
    params.set('sort[order]', sort.order ?? 'asc');
  }

  if (filters?.length) {
    params.set('filters', JSON.stringify(filters));
  }

  return `${API_BASE}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Step 3: React component with the dataProvider plugin.
// ---------------------------------------------------------------------------

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const removeConfirmedRef = useRef(false);

  const fetchRows = useCallback(
    async (
      params: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl(params);
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      return res.json() as Promise<DataProviderFetchResult>;
    },
    []
  );

  const onRowsCreate = useCallback(async ({ rowsAmount }: RowsCreatePayload): Promise<unknown[]> => {
    const res = await fetch(`${API_BASE}create-rows/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() ?? '',
      },
      body: JSON.stringify({ rowsAmount }),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

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

  const onRowsUpdate = useCallback(async (rows: RowUpdatePayload[]): Promise<void> => {
    const res = await fetch(`${API_BASE}update-rows/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() ?? '',
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }, []);

  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    const res = await fetch(`${API_BASE}remove-rows/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() ?? '',
      },
      body: JSON.stringify(rowIds),
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }
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

  const beforeRowsMutation = useCallback((operation: string, payload: { rowsRemove: unknown[] }) => {
    if (operation === 'remove' && !removeConfirmedRef.current) {
      const count = payload.rowsRemove.length;
      const hot = hotRef.current?.hotInstance;
      if (!hot) return false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notification = hot.getPlugin('notification') as any;
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
              (hot.getPlugin('dataProvider') as any).removeRows(payload.rowsRemove).finally(() => {
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
        ref={hotRef}
        dataProvider={dataProvider}
        beforeRowsMutation={beforeRowsMutation}
        pagination={{ pageSize: 10 }}
        columnSorting={true}
        filters={true}
        dropdownMenu={['filter_by_condition', 'filter_action_bar']}
        contextMenu={true}
        emptyDataState={true}
        notification={true}
        dialog={true}
        colHeaders={['First Name', 'Last Name', 'Department', 'Role', 'Salary']}
        columns={[
          { data: 'first_name', type: 'text' },
          { data: 'last_name',  type: 'text' },
          { data: 'department', type: 'text' },
          { data: 'role',       type: 'text' },
          { data: 'salary',     type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } },
        ]}
        rowHeaders={true}
        height={400}
        width="100%"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
