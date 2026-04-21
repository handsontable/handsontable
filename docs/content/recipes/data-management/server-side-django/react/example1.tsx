import { useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

// ---------------------------------------------------------------------------
// Step 1: Read Django's CSRF token from the cookie.
//
// Django sets a `csrftoken` cookie on every response. You must read it and
// include it in the X-CSRFToken request header for every mutating request
// (POST, PATCH, DELETE). Without it Django returns 403 Forbidden.
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
// Handsontable's dataProvider calls fetchRows with { page, pageSize, sort,
// filters }. This helper converts those into query string parameters that
// Django REST Framework understands.
//
// - `page` and `pageSize` map directly (DRF uses page_size_query_param =
//   'pageSize', so the parameter name matches without any translation).
// - `sort` becomes sort[prop] + sort[order] -- the Django view reads these
//   and converts them to DRF's `ordering` param internally.
// - Each filter condition in the `filters` array becomes a filters[N][...]
//   triplet (prop, value, condition).
// ---------------------------------------------------------------------------
function buildUrl(base: string, { page, pageSize, sort, filters }: DataProviderQueryParameters): string {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  if (sort?.prop) {
    params.set('sort[prop]', sort.prop);
    params.set('sort[order]', sort.order ?? 'asc');
  }

  if (filters?.length) {
    filters.forEach(({ prop, value, condition }, i) => {
      params.set(`filters[${i}][prop]`, prop);
      params.set(`filters[${i}][value]`, String(value));
      params.set(`filters[${i}][condition]`, condition);
    });
  }

  return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Step 3: React component with the dataProvider plugin.
//
// `rowId: 'id'` tells dataProvider which field uniquely identifies each row.
// Django's auto-increment primary key is used here.
//
// Each callback receives the signal from the AbortController so that
// in-flight requests are cancelled when the user sorts or filters before
// the previous request completes.
// ---------------------------------------------------------------------------

const ExampleComponent = () => {
  // fetchRows is called on mount and whenever page, sort, or filters change.
  const fetchRows = useCallback(
    async (
      params: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl('http://localhost:8000/api/employees/', params);
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      // Django pagination.py already maps DRF's { count, results } to
      // { rows, totalRows }, so we can return the JSON directly.
      return res.json() as Promise<DataProviderFetchResult>;
    },
    []
  );

  // onRowsCreate is called when the user adds new rows via the context menu.
  // It receives an array of row objects without ids.
  const onRowsCreate = useCallback(async (rows: unknown): Promise<unknown> => {
    const res = await fetch('http://localhost:8000/api/employees/create-rows/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() ?? '',
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    // Return the created rows so dataProvider can update its row map
    // with the server-assigned ids.
    return res.json();
  }, []);

  // onRowsUpdate is called when the user edits cells.
  // It receives an array of partial row objects that each contain the row
  // id plus only the changed fields.
  const onRowsUpdate = useCallback(async (rows: unknown): Promise<void> => {
    const res = await fetch('http://localhost:8000/api/employees/update-rows/', {
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

  // onRowsRemove is called when the user deletes rows.
  // It receives an array of row ids.
  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    const res = await fetch('http://localhost:8000/api/employees/remove-rows/', {
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

  return (
    <div>
      <HotTable
        dataProvider={dataProvider}
        // Show 10 rows per page; users can change this via the pagination UI.
        pagination={{ pageSize: 10 }}
        // Enable server-side column sorting. dataProvider passes the sort state
        // to fetchRows automatically.
        columnSorting={true}
        // Enable the column filter UI. dataProvider passes active conditions
        // to fetchRows automatically.
        filters={true}
        dropdownMenu={['filter_by_condition', 'filter_action_bar']}
        // Show a friendly illustration when the server returns zero rows
        // (for example, when a filter matches nothing).
        emptyDataState={true}
        // Show automatic error toasts when fetchRows or a mutation callback throws.
        // This uses the Notification plugin internally.
        notification={true}
        colHeaders={['First Name', 'Last Name', 'Department', 'Role', 'Salary']}
        columns={[
          { data: 'first_name', type: 'text' },
          { data: 'last_name', type: 'text' },
          { data: 'department', type: 'text' },
          { data: 'role', type: 'text' },
          { data: 'salary', type: 'numeric', numericFormat: { pattern: '$0,0' } },
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
