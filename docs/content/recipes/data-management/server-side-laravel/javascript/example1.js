import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
// Client-side mock — simulates what a Laravel /api/products endpoint returns.
// Replace every mockXxx() call in the dataProvider callbacks below with a real
// fetch() to your Laravel API. The buildUrl() helper (also below) shows you
// exactly which query-string shape Laravel expects.
const PRODUCTS = [
  { id: 1, name: 'Laptop Pro 15', sku: 'LAP-001', category: 'Electronics', price: 1299.99, stock: 42 },
  { id: 2, name: 'Wireless Mouse', sku: 'MOU-002', category: 'Accessories', price: 29.99, stock: 315 },
  { id: 3, name: 'USB-C Hub 7-in-1', sku: 'HUB-003', category: 'Accessories', price: 49.99, stock: 178 },
  { id: 4, name: 'NVMe SSD 1 TB', sku: 'SSD-004', category: 'Storage', price: 109.99, stock: 260 },
  { id: 5, name: 'Mechanical Keyboard', sku: 'KEY-005', category: 'Peripherals', price: 139.99, stock: 95 },
  { id: 6, name: 'Gigabit Switch 8-Port', sku: 'SW8-006', category: 'Networking', price: 59.99, stock: 74 },
  { id: 7, name: 'Portable Monitor 15"', sku: 'MON-007', category: 'Electronics', price: 249.99, stock: 38 },
  { id: 8, name: 'Webcam 4K', sku: 'CAM-008', category: 'Peripherals', price: 89.99, stock: 112 },
  { id: 9, name: 'External HDD 2 TB', sku: 'HDD-009', category: 'Storage', price: 74.99, stock: 193 },
  { id: 10, name: 'Wi-Fi 6 Router', sku: 'RTR-010', category: 'Networking', price: 179.99, stock: 55 },
  { id: 11, name: 'Noise-Cancelling Headphones', sku: 'HP-011', category: 'Accessories', price: 199.99, stock: 67 },
  { id: 12, name: 'Thunderbolt Dock', sku: 'DOC-012', category: 'Accessories', price: 219.99, stock: 31 },
  { id: 13, name: 'Laptop Stand', sku: 'STD-013', category: 'Accessories', price: 39.99, stock: 220 },
  { id: 14, name: 'Gaming Controller', sku: 'CTR-014', category: 'Peripherals', price: 69.99, stock: 148 },
  { id: 15, name: 'HDMI Cable 2 m', sku: 'CBL-015', category: 'Accessories', price: 12.99, stock: 500 },
  { id: 16, name: 'MicroSD 256 GB', sku: 'MSD-016', category: 'Storage', price: 29.99, stock: 387 },
  { id: 17, name: 'PoE Switch 24-Port', sku: 'POE-017', category: 'Networking', price: 299.99, stock: 18 },
  { id: 18, name: 'Smart Plug 4-Pack', sku: 'PLG-018', category: 'Electronics', price: 34.99, stock: 142 },
  { id: 19, name: 'USB Microphone', sku: 'MIC-019', category: 'Peripherals', price: 79.99, stock: 89 },
  { id: 20, name: 'Ergonomic Chair Mat', sku: 'MAT-020', category: 'Accessories', price: 44.99, stock: 61 },
  { id: 21, name: 'Tablet 10" Wi-Fi', sku: 'TAB-021', category: 'Electronics', price: 349.99, stock: 27 },
  { id: 22, name: 'Power Bank 20000 mAh', sku: 'PBK-022', category: 'Accessories', price: 49.99, stock: 203 },
];

let nextId = PRODUCTS.length + 1;

// Applies Handsontable filter conditions against in-memory rows.
// Each filter object has the shape: { prop, condition: { name, args } }.
function applyFilters(rows, filters) {
  if (!filters || !filters.length) return rows;
  return rows.filter(row =>
    filters.every(({ prop, condition }) => {
      const cell = row[prop];
      const [v, v2] = condition.args ?? [];
      switch (condition.name) {
        case 'contains': return String(cell ?? '').toLowerCase().includes(String(v ?? '').toLowerCase());
        case 'not_contains': return !String(cell ?? '').toLowerCase().includes(String(v ?? '').toLowerCase());
        case 'begins_with': return String(cell ?? '').toLowerCase().startsWith(String(v ?? '').toLowerCase());
        case 'ends_with': return String(cell ?? '').toLowerCase().endsWith(String(v ?? '').toLowerCase());
        case 'eq': return Number(cell) === Number(v);
        case 'neq': return Number(cell) !== Number(v);
        case 'gt': return Number(cell) > Number(v);
        case 'gte': return Number(cell) >= Number(v);
        case 'lt': return Number(cell) < Number(v);
        case 'lte': return Number(cell) <= Number(v);
        case 'between': return Number(cell) >= Number(v) && Number(cell) <= Number(v2);
        case 'not_between': return Number(cell) < Number(v) || Number(cell) > Number(v2);
        case 'empty': return cell === null || cell === undefined || cell === '';
        case 'not_empty': return cell !== null && cell !== undefined && cell !== '';
        default: return true;
      }
    })
  );
}

// Sorts rows in place. sort has the shape: { prop, order } or null.
function applySort(rows, sort) {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const aVal = a[sort.prop];
    const bVal = b[sort.prop];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    return sort.order === 'desc' ? -cmp : cmp;
  });
}

// Simulates the Laravel controller's index() method: filter → sort → paginate.
// Returns { data: [...], total: n } — the same shape as the real Laravel endpoint.
function mockFetchProducts({ page, pageSize, sort, filters }) {
  let rows = applyFilters([...PRODUCTS], filters);
  rows = applySort(rows, sort);
  const total = rows.length;
  const data = rows.slice((page - 1) * pageSize, page * pageSize);
  return Promise.resolve({ data, total });
}

// Simulates the Laravel controller's store() method.
function mockCreateProducts({ rowsAmount }) {
  for (let i = 0; i < rowsAmount; i++) {
    PRODUCTS.push({
      id: nextId,
      name: '',
      sku: `NEW-${String(nextId).padStart(3, '0')}`,
      category: 'Electronics',
      price: 0,
      stock: 0,
    });
    nextId += 1;
  }
  return Promise.resolve();
}

// Simulates the Laravel controller's batchUpdate() method.
function mockUpdateProducts(rows) {
  rows.forEach(({ id, changes }) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (product) Object.assign(product, changes);
  });
  return Promise.resolve();
}

// Simulates the Laravel controller's batchDestroy() method.
function mockDeleteProducts(rowIds) {
  rowIds.forEach(id => {
    const index = PRODUCTS.findIndex(p => p.id === id);
    if (index !== -1) PRODUCTS.splice(index, 1);
  });
  return Promise.resolve();
}
/* end:skip-in-preview */

// Serializes fetchRows query parameters into a URL query string that
// Laravel's request()->input() reads directly.
//
// Handsontable sends:
//   sort: { prop: 'name', order: 'asc' } or null
//   filters: [{ prop: 'price', condition: { name: 'gt', args: [100] } }] or null
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
      // Single-value conditions (contains, gt, eq …)
      if (args[0] != null) params.set(`filters[${i}][value]`, String(args[0]));
      // Range conditions (between, not_between)
      if (args[1] != null) params.set(`filters[${i}][value2]`, String(args[1]));
    });
  }

  return `${base}?${params}`;
}

// Reads the CSRF token that Blade injects via <meta name="csrf-token">.
// For SPA routes protected by Laravel Sanctum, call GET /sanctum/csrf-cookie
// first and rely on the cookie; no manual header is needed.
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

// Get the DOM element where Handsontable will be rendered.
const container = document.querySelector('#example1');

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  dataProvider: {
    // rowId tells Handsontable which field holds the stable server-side row ID.
    // All update and remove callbacks receive this ID so Laravel can target the right row.
    rowId: 'id',

    // fetchRows is called on every page, sort, and filter change.
    // queryParameters contains: { page, pageSize, sort, filters }.
    // signal is an AbortSignal — pass it to fetch() so stale requests cancel automatically.
    fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
      // In a real Laravel app, replace the two lines below with:
      //
      //   const url = buildUrl('/api/products', { page, pageSize, sort, filters });
      //   const res = await fetch(url, { signal });
      //   if (!res.ok) throw new Error(`HTTP ${res.status}`);
      //   const json = await res.json();
      //
      // Laravel returns: { data: [...], total: n }
      // eslint-disable-next-line no-unused-vars
      void signal; // used by real fetch(); unused by the mock
      const json = await mockFetchProducts({ page, pageSize, sort, filters });
      return { rows: json.data, totalRows: json.total };
    },

    // onRowsCreate fires when the user inserts rows from the context menu.
    // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
    onRowsCreate: async (payload) => {
      // In a real Laravel app, replace the line below with:
      //
      //   await fetch('/api/products', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      //     body: JSON.stringify(payload),
      //   });
      //
      await mockCreateProducts(payload);
    },

    // onRowsUpdate fires after a cell edit, paste, or autofill batch.
    // rows is an array of { id, changes, rowData } objects.
    onRowsUpdate: async (rows) => {
      // In a real Laravel app, replace the line below with:
      //
      //   await fetch('/api/products', {
      //     method: 'PATCH',
      //     headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      //     body: JSON.stringify(rows),
      //   });
      //
      await mockUpdateProducts(rows);
    },

    // onRowsRemove fires when the user removes rows from the context menu.
    // rowIds is an array of stable row IDs — the values of the `rowId` field.
    onRowsRemove: async (rowIds) => {
      // In a real Laravel app, replace the line below with:
      //
      //   await fetch('/api/products', {
      //     method: 'DELETE',
      //     headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      //     body: JSON.stringify(rowIds),
      //   });
      //
      await mockDeleteProducts(rowIds);
    },
  },

  // beforeRowsMutation fires before any create, update, or remove operation.
  // Return false to cancel. Use it to show a confirmation dialog before deletes.
  beforeRowsMutation(operation, payload) {
    if (operation === 'remove') {
      const count = payload.rowsRemove.length;
      // eslint-disable-next-line no-alert
      return window.confirm(
        `Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`
      );
    }
  },

  // pagination controls which page is shown. pageSize sets rows per request.
  pagination: { pageSize: 10 },

  // columnSorting sends { prop, order } in queryParameters.sort on each sort change.
  columnSorting: true,

  // filters sends condition objects in queryParameters.filters on each filter change.
  filters: true,

  // dropdownMenu enables the column header filter button.
  dropdownMenu: true,

  // contextMenu exposes "Insert row above / below" and "Remove row" options.
  contextMenu: true,

  // emptyDataState shows a loading overlay while fetchRows is in flight,
  // and an empty-state overlay when the result set is empty.
  emptyDataState: true,

  // notification shows an error toast when fetchRows or any CRUD callback rejects.
  // Fetch failures include a Refetch button that retries the last request.
  notification: true,

  rowHeaders: true,
  colHeaders: ['Name', 'SKU', 'Category', 'Price', 'Stock'],
  columns: [
    { data: 'name', type: 'text' },
    // SKU is generated server-side so it is read-only in the grid.
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
});
