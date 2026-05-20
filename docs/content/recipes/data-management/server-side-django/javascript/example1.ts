import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

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
// Step 2: Type definitions for fetchRows parameters.
//
// Handsontable passes sort and filter state to fetchRows. Typing them
// makes the URL builder easier to read and catch mistakes at compile time.
// ---------------------------------------------------------------------------
interface SortState {
  prop: string;
  order: 'asc' | 'desc';
}

interface FilterCondition {
  prop: string;
  value: string;
  condition: string;
}

interface FetchParams {
  page: number;
  pageSize: number;
  sort?: SortState;
  filters?: FilterCondition[];
}

// The response shape returned by pagination.py (already mapped from DRF defaults).
interface PagedResponse<T> {
  rows: T[];
  totalRows: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  salary: number;
}

// ---------------------------------------------------------------------------
// Step 3: Build the request URL for fetchRows.
//
// - `page` and `pageSize` map directly (DRF reads pageSize via
//   page_size_query_param = 'pageSize').
// - `sort` becomes sort[prop] + sort[order] -- the Django view reads these
//   and converts them to DRF's `ordering` param internally.
// - Each filter condition becomes a filters[N][...] triplet.
// ---------------------------------------------------------------------------
function buildUrl(base: string, { page, pageSize, sort, filters }: FetchParams): string {
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
      params.set(`filters[${i}][value]`, value);
      params.set(`filters[${i}][condition]`, condition);
    });
  }

  return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Step 4: Initialize Handsontable with the dataProvider plugin.
//
// `rowId: 'id'` tells dataProvider which field uniquely identifies each row.
// Django's auto-increment primary key is used here.
// ---------------------------------------------------------------------------
const container = document.querySelector<HTMLElement>('#example1');

if (!container) {
  throw new Error('Missing #example1 element.');
}

const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    // fetchRows is called on mount and whenever page, sort, or filters change.
    fetchRows: async (
      { page, pageSize, sort, filters }: FetchParams,
      { signal }: { signal: AbortSignal }
    ): Promise<PagedResponse<Employee>> => {
      const url = buildUrl('http://localhost:8000/api/employees/', {
        page,
        pageSize,
        sort,
        filters,
      });

      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      // pagination.py maps DRF's { count, results } to { rows, totalRows },
      // so we can return the JSON directly without any further transformation.
      return res.json() as Promise<PagedResponse<Employee>>;
    },

    // onRowsCreate receives new rows without ids. Return the server response
    // so dataProvider can update its row map with the server-assigned ids.
    onRowsCreate: async (rows: Partial<Employee>[]): Promise<Employee[]> => {
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

      return res.json() as Promise<Employee[]>;
    },

    // onRowsUpdate receives partial rows (id + changed fields only).
    onRowsUpdate: async (rows: Array<Partial<Employee> & { id: number }>): Promise<void> => {
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
    },

    // onRowsRemove receives an array of row ids to delete.
    onRowsRemove: async (rowIds: number[]): Promise<void> => {
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
    },
  },

  pagination: { pageSize: 10 },
  columnSorting: true,
  filters: true,
  dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
  emptyDataState: true,
  notification: true,

  colHeaders: ['First Name', 'Last Name', 'Department', 'Role', 'Salary'],
  columns: [
    { data: 'first_name', type: 'text' },
    { data: 'last_name', type: 'text' },
    { data: 'department', type: 'text' },
    { data: 'role', type: 'text' },
    { data: 'salary', type: 'numeric', numericFormat: { pattern: '$0,0' } },
  ],

  rowHeaders: true,
  height: 400,
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);

export { hot };
