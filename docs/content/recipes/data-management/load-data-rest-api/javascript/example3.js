import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// Step 1: Cache the full response after the first request.
// Every subsequent fetchRows call (page change, column sort) reuses this
// without hitting the network again.
let cachedRows = null;

async function loadAllRows(signal) {
  if (cachedRows !== null) {
    return cachedRows;
  }

  const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const users = await response.json();

  cachedRows = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    city: u.address?.city ?? '',
    company: u.company?.name ?? '',
  }));

  return cachedRows;
}

const container = document.querySelector('#example3');

if (!container) {
  throw new Error('Missing #example3 element.');
}

const statusBar = document.createElement('div');
const status = document.createElement('p');
const gridContainer = document.createElement('div');

statusBar.style.display = 'flex';
statusBar.style.alignItems = 'center';
statusBar.style.marginBottom = '8px';

status.style.margin = '0';
status.style.fontFamily = 'Arial, sans-serif';
status.style.fontSize = '14px';
status.textContent = 'Loading...';

container.appendChild(statusBar);
statusBar.appendChild(status);
container.appendChild(gridContainer);

new Handsontable(gridContainer, {
  // Step 2: Use dataProvider instead of a static data array.
  // Handsontable calls fetchRows automatically on init, page change, and sort change.
  dataProvider: {
    // rowId tells the plugin which field holds the stable row identity.
    // It is required for CRUD callbacks and internal refetch tracking.
    rowId: 'id',

    // Step 3: fetchRows receives current query parameters and an AbortSignal.
    // Return { rows, totalRows } so the Pagination plugin knows the total row count.
    async fetchRows({ page, pageSize, sort }, { signal }) {
      let rows = await loadAllRows(signal);

      // Step 4: Apply server-side sort from query parameters.
      // In production, pass sort.prop and sort.order to your API instead.
      if (sort) {
        rows = [...rows].sort((a, b) => {
          const av = a[sort.prop];
          const bv = b[sort.prop];
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;

          return sort.order === 'asc' ? cmp : -cmp;
        });
      }

      // Step 5: Apply server-side pagination from query parameters.
      // In production, pass page and pageSize to your API instead.
      const start = (page - 1) * pageSize;

      return {
        rows: rows.slice(start, start + pageSize),
        totalRows: rows.length,
      };
    },

    // Step 6: CRUD callbacks. jsonplaceholder is read-only, so these are no-ops.
    // Replace with POST / PATCH / DELETE calls to a real API.
    onRowsCreate: async () => {},
    onRowsUpdate: async () => {},
    onRowsRemove: async () => {},
  },

  colHeaders: ['ID', 'Name', 'Username', 'Email', 'City', 'Company'],
  columns: [
    { data: 'id', type: 'numeric', width: 70, readOnly: true },
    { data: 'name', type: 'text', width: 190, readOnly: true },
    { data: 'username', type: 'text', width: 150, readOnly: true },
    { data: 'email', type: 'text', width: 220, readOnly: true },
    { data: 'city', type: 'text', width: 140, readOnly: true },
    { data: 'company', type: 'text', width: 180, readOnly: true },
  ],

  // Step 7: Enable the Pagination plugin and pass pageSize so the plugin knows
  // how many rows to request. columnSorting enables server-driven sort.
  // emptyDataState shows a loading overlay while fetchRows is in flight.
  pagination: { pageSize: 5 },
  columnSorting: true,
  emptyDataState: true,

  rowHeaders: true,
  height: 360,
  width: '100%',
  stretchH: 'all',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',

  // Step 8: Use fetch hooks to update the status label.
  // skipLoading is true for internal refetches (after sort) -- skip the "Loading..." message
  // in those cases so the grid does not flash a spinner on every column header click.
  beforeDataProviderFetch: ({ skipLoading }) => {
    if (!skipLoading) {
      status.textContent = 'Loading...';
      status.style.color = 'var(--ht-foreground-color, #202124)';
    }
  },
  afterDataProviderFetch: () => {
    status.textContent = 'Loaded from REST API via dataProvider.';
    status.style.color = 'var(--ht-foreground-color, #202124)';
  },
  afterDataProviderFetchError: (error) => {
    status.textContent = `Error: ${error.message}`;
    status.style.color = 'var(--ht-notification-error-accent, #c62828)';
  },
});
