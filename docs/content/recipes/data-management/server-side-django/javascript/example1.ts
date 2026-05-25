import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  DataProvider,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Filters,
  ColumnSorting,
  Pagination,
  EmptyDataState,
  Notification,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/cellTypes';
import type {
  DataProviderQueryParameters,
  DataProviderFetchResult,
  RowsCreatePayload,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';

registerPlugin(DataProvider);
registerPlugin(ContextMenu);
registerPlugin(Dialog);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerPlugin(ColumnSorting);
registerPlugin(Pagination);
registerPlugin(EmptyDataState);
registerPlugin(Notification);
registerAllCellTypes();

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
// - `sort` becomes sort[prop] + sort[order].
// - `filters` is a DataProviderFilterColumn[] array -- pass it as a JSON
//   string so Django can parse the full nested structure with json.loads().
//
// Vite proxies /api/* → http://localhost:8000, so we use a relative URL.
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
// Step 3: Initialize Handsontable with the dataProvider plugin.
// ---------------------------------------------------------------------------
const container = document.querySelector<HTMLElement>('#example1')!;

let removeConfirmed = false;

const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    fetchRows: async (
      params: DataProviderQueryParameters,
      { signal }: { signal: AbortSignal }
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl(params);
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      return res.json() as Promise<DataProviderFetchResult>;
    },

    onRowsCreate: async ({ rowsAmount }: RowsCreatePayload): Promise<unknown[]> => {
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
      (hot.getPlugin('notification') as any).showMessage({
        variant: 'success',
        title: 'Row added',
        message: `Created: ${info}`,
        duration: 3000,
      });
      return data;
    },

    onRowsUpdate: async (rows: RowUpdatePayload[]): Promise<void> => {
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
    },

    onRowsRemove: async (rowIds: unknown[]): Promise<void> => {
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
    },
  },

  beforeRowsMutation(operation: string, payload: { rowsRemove: unknown[] }): boolean | void {
    if (operation === 'remove' && !removeConfirmed) {
      const count = payload.rowsRemove.length;
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
              removeConfirmed = true;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (hot.getPlugin('dataProvider') as any).removeRows(payload.rowsRemove).finally(() => {
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

  pagination: { pageSize: 10 },
  columnSorting: true,
  filters: true,
  dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
  contextMenu: true,
  emptyDataState: true,
  notification: true,
  dialog: true,

  colHeaders: ['First Name', 'Last Name', 'Department', 'Role', 'Salary'],
  columns: [
    { data: 'first_name', type: 'text' },
    { data: 'last_name',  type: 'text' },
    { data: 'department', type: 'text' },
    { data: 'role',       type: 'text' },
    { data: 'salary',     type: 'numeric', numericFormat: { pattern: '$0,0' } },
  ],

  rowHeaders: true,
  height: 400,
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);

export { hot };
