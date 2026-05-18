import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

type ApiUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: { city?: string };
  company?: { name?: string };
};

const STATUS_LOADING = 'Loading users...';
const STATUS_READY = 'Loaded users from REST API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

const rootContainer = document.querySelector('#example1') as HTMLDivElement;

const controlsContainer = document.createElement('div');
const controls = document.createElement('div');
const statusOutput = document.createElement('output');
const retryButton = document.createElement('button');
const gridContainer = document.createElement('div');

controlsContainer.className = 'example-controls-container';
controls.className = 'controls';
statusOutput.id = 'example1-status';

retryButton.type = 'button';
retryButton.textContent = 'Retry';
retryButton.hidden = true;

controls.appendChild(retryButton);
controlsContainer.appendChild(controls);
controlsContainer.appendChild(statusOutput);
rootContainer.appendChild(controlsContainer);
rootContainer.appendChild(gridContainer);

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

function setUiState({
  loading = false,
  hasError = false,
  message = '',
}: {
  loading?: boolean;
  hasError?: boolean;
  message?: string;
}) {
  statusOutput.textContent = message;
  statusOutput.classList.toggle('is-error', hasError);
  retryButton.hidden = !hasError;
  retryButton.disabled = loading;
}

function mapUsersToGridRows(users: ApiUser[]) {
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

    const users = (await response.json()) as ApiUser[];

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
