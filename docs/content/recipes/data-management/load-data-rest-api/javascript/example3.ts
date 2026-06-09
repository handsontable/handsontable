import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderBeforeFetchParameters,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

type UserRow = {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;
  company: string;
};

// Step 1: Cache the full response after the first request.
// Every subsequent fetchRows call (page change, column sort) reuses this
// without hitting the network again.
let cachedRows: UserRow[] | null = null;

async function loadAllRows(signal: AbortSignal): Promise<UserRow[]> {
  if (cachedRows !== null) {
    return cachedRows;
  }

  const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const users = (await response.json()) as Array<{
    id: number;
    name: string;
    username: string;
    email: string;
    address?: { city?: string };
    company?: { name?: string };
  }>;

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

const rootContainer = document.querySelector('#example3') as HTMLDivElement;

const controlsContainer = document.createElement('div');
const statusOutput = document.createElement('output');
const gridContainer = document.createElement('div');

controlsContainer.className = 'example-controls-container';
statusOutput.id = 'example3-status';
statusOutput.textContent = 'Loading...';

rootContainer.appendChild(controlsContainer);
controlsContainer.appendChild(statusOutput);
rootContainer.appendChild(gridContainer);

new Handsontable(gridContainer, {
  // Step 2: Use dataProvider instead of a static data array.
  // Handsontable calls fetchRows automatically on init, page change, and sort change.
  dataProvider: {
    // rowId tells the plugin which field holds the stable row identity.
    // It is required for CRUD callbacks and internal refetch tracking.
    rowId: 'id',

    // Step 3: fetchRows receives current query parameters and an AbortSignal.
    // Return { rows, totalRows } so the Pagination plugin knows the total row count.
    async fetchRows(
      { page, pageSize, sort }: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ) {
      let rows = await loadAllRows(signal);

      // Step 4: Apply server-side sort from query parameters.
      // In production, pass sort.prop and sort.order to your API instead.
      if (sort) {
        rows = [...rows].sort((a, b) => {
          const av = a[sort.prop as keyof UserRow];
          const bv = b[sort.prop as keyof UserRow];
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
  beforeDataProviderFetch: ({ skipLoading }: DataProviderBeforeFetchParameters) => {
    if (!skipLoading) {
      statusOutput.textContent = 'Loading...';
      statusOutput.classList.remove('is-error');
    }
  },
  afterDataProviderFetch: () => {
    statusOutput.textContent = 'Loaded from REST API via dataProvider.';
    statusOutput.classList.remove('is-error');
  },
  afterDataProviderFetchError: (error: Error) => {
    statusOutput.textContent = `Error: ${error.message}`;
    statusOutput.classList.add('is-error');
  },
});
