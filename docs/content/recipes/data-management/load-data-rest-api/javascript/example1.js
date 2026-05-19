import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const STATUS_LOADING = 'Loading users...';
const STATUS_READY = 'Loaded users from REST API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

const container = document.querySelector('#example1');

if (!container) {
  throw new Error('Missing #example1 element.');
}

const status = document.createElement('p');
const retryButton = document.createElement('button');

status.textContent = STATUS_LOADING;
status.style.margin = '0';
status.style.fontFamily = 'Arial, sans-serif';
status.style.fontSize = '14px';

retryButton.type = 'button';
retryButton.textContent = 'Retry';
retryButton.hidden = true;
retryButton.style.marginBottom = '0';

const statusBar = document.createElement('div');
const gridContainer = document.createElement('div');

statusBar.style.display = 'flex';
statusBar.style.gap = '12px';
statusBar.style.alignItems = 'center';
statusBar.style.marginBottom = '8px';

container.appendChild(statusBar);
statusBar.appendChild(status);
statusBar.appendChild(retryButton);
container.appendChild(gridContainer);

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
  rowHeaders: true,
  height: 360,
  width: '100%',
  stretchH: 'all',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function setUiState({ loading = false, hasError = false, message = '' } = {}) {
  status.textContent = message;
  status.style.color = hasError
    ? 'var(--ht-cell-error-foreground-color, #c62828)'
    : 'var(--ht-foreground-color, #202124)';
  retryButton.hidden = !hasError;
  retryButton.disabled = loading;
}

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

async function loadUsers() {
  setUiState({ loading: true, message: STATUS_LOADING });

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const users = await response.json();

    hot.loadData(mapUsersToGridRows(users));
    setUiState({ message: STATUS_READY });
  } catch (_error) {
    hot.loadData([]);
    setUiState({ hasError: true, message: STATUS_ERROR });
  }
}

retryButton.addEventListener('click', () => {
  loadUsers();
});

loadUsers();
