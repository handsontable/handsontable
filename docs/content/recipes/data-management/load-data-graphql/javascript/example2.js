import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const USERS_QUERY = `
  query {
    users {
      data {
        id
        name
        username
        email
        address {
          city
        }
        company {
          name
        }
      }
    }
  }
`;

const STATUS_LOADING = 'Loading users...';
const STATUS_READY =
  'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
const STATUS_REFRESHING = 'Refreshing...';
const STATUS_REFRESHED = 'Data refreshed -- column sort order was preserved.';
const STATUS_ERROR = 'Failed to load users. Try again.';

const container = document.querySelector('#example2');

if (!container) {
  throw new Error('Missing #example2 element.');
}

const controlsContainer = document.createElement('div');
const controls = document.createElement('div');
const statusOutput = document.createElement('output');
const refreshButton = document.createElement('button');
const retryButton = document.createElement('button');
const gridContainer = document.createElement('div');

controlsContainer.className = 'example-controls-container';
controls.className = 'controls';
statusOutput.id = 'example2-status';

refreshButton.type = 'button';
refreshButton.textContent = 'Refresh';
refreshButton.hidden = true;

retryButton.type = 'button';
retryButton.textContent = 'Retry';
retryButton.hidden = true;

controls.appendChild(refreshButton);
controls.appendChild(retryButton);
controlsContainer.appendChild(controls);
controlsContainer.appendChild(statusOutput);
container.appendChild(controlsContainer);
container.appendChild(gridContainer);

// Step 1: Initialize the grid with columnSorting enabled and an empty dataset.
const hot = new Handsontable(gridContainer, {
  data: [],
  colHeaders: ['ID', 'Name', 'Username', 'Email', 'City', 'Company'],
  columns: [
    { data: 'id', type: 'numeric', width: 70 },
    { data: 'name', type: 'text', width: 190 },
    { data: 'username', type: 'text', width: 150 },
    { data: 'email', type: 'text', width: 220 },
    { data: 'city', type: 'text', width: 140 },
    { data: 'company', type: 'text', width: 180 },
  ],
  // Enables clickable sort indicators on column headers.
  columnSorting: true,
  rowHeaders: true,
  height: 360,
  width: '100%',
  stretchH: 'all',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// Step 2: A helper that keeps the toolbar consistent with the current request state.
function setUiState({ loading = false, hasError = false, message = '' } = {}) {
  statusOutput.textContent = message;
  statusOutput.classList.toggle('is-error', hasError);
  // Show "Retry" only when there is an error.
  retryButton.hidden = !hasError;
  // Show "Refresh" only when the grid has data and no error is active.
  refreshButton.hidden = hasError || loading;
  refreshButton.disabled = loading;
  retryButton.disabled = loading;
}

// Step 3: Map the API response to flat row objects that match the column definitions.
function mapUsersToGridRows(users) {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    city: user.address?.city ?? '',
    company: user.company?.name ?? '',
  }));
}

// Step 4: Shared fetch helper used by both initialLoad() and refreshUsers().
async function fetchUsers() {
  const response = await fetch('https://graphqlzero.almansi.me/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: USERS_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }

  const payload = await response.json();

  // GraphQL APIs can return HTTP 200 and still include execution errors.
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed.');
  }

  return payload.data?.users?.data ?? [];
}

// Step 5: Initial load uses loadData(), which resets all grid states.
// This is correct for a first load -- there is no existing state to preserve.
async function initialLoad() {
  setUiState({ loading: true, message: STATUS_LOADING });

  try {
    const users = await fetchUsers();

    hot.loadData(mapUsersToGridRows(users));
    setUiState({ message: STATUS_READY });
  } catch (_error) {
    hot.loadData([]);
    setUiState({ hasError: true, message: STATUS_ERROR });
  }
}

// Step 6: Subsequent refreshes use updateData(), which replaces the data
// without resetting column sort order, selection, or column order.
async function refreshUsers() {
  setUiState({ loading: true, message: STATUS_REFRESHING });

  try {
    const users = await fetchUsers();

    hot.updateData(mapUsersToGridRows(users));
    setUiState({ message: STATUS_REFRESHED });
  } catch (_error) {
    // On error, do not clear the grid -- the existing data is still valid.
    setUiState({ hasError: true, message: STATUS_ERROR });
  }
}

refreshButton.addEventListener('click', () => {
  refreshUsers();
});

retryButton.addEventListener('click', () => {
  initialLoad();
});

initialLoad();
