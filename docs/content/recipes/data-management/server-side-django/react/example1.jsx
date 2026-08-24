import { useCallback, useMemo, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// ---------------------------------------------------------------------------
// Step 1: Read Django's CSRF token from the cookie.
//
// Django sets a `csrftoken` cookie on every response. You must read it and
// include it in the X-CSRFToken request header for every mutating request
// (POST, PATCH, DELETE). Without it Django returns 403 Forbidden.
// ---------------------------------------------------------------------------
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
    ?.split('=')[1];
}

// ---------------------------------------------------------------------------
// Step 2: Build the request URL for fetchRows.
//
// - `sort` becomes sort[prop] + sort[order].
// - `filters` is a DataProviderFilterColumn[] array -- pass it as a JSON
//   string so Django can parse the full nested structure with json.loads().
//
// Vite proxies /api/* → http://localhost:8000, so we use a relative URL.
// ---------------------------------------------------------------------------
const API_BASE = '/api/employees/';

function buildUrl({ page, pageSize, sort, filters }) {
  const params = new URLSearchParams();

  params.set('page', page);
  params.set('pageSize', pageSize);

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
  const hotRef = useRef(null);
  const removeConfirmedRef = useRef(false);

  const fetchRows = useCallback(async ({ page, pageSize, sort, filters }, { signal }) => {
    const url = buildUrl({ page, pageSize, sort, filters });
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    // pagination.py already maps DRF's { count, results } to
    // { rows, totalRows }, so we can return the JSON directly.
    return res.json();
  }, []);

  const onRowsCreate = useCallback(async ({ rowsAmount }) => {
    const res = await fetch(`${API_BASE}create-rows/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify({ rowsAmount }),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    const data = await res.json();
    const info = data.map(r => `(id: ${r.id})`).join(', ');
    hotRef.current?.hotInstance?.getPlugin('notification').showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${info}`,
      duration: 3000,
    });
    return data;
  }, []);

  const onRowsUpdate = useCallback(async (rows) => {
    const res = await fetch(`${API_BASE}update-rows/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }, []);

  const onRowsRemove = useCallback(async (rowIds) => {
    const res = await fetch(`${API_BASE}remove-rows/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
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
