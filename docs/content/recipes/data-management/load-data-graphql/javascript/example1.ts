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
const STATUS_READY = 'Loaded users from GraphQL API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

const container = document.querySelector('#example1');

if (!container) {
  throw new Error('Missing #example1 element.');
}

const statusBar = document.createElement('div');
const statusLabel = document.createElement('p');
const retryButton = document.createElement('button');
const gridContainer = document.createElement('div');

statusBar.style.display = 'flex';
statusBar.style.gap = '12px';
statusBar.style.alignItems = 'center';
statusBar.style.marginBottom = '8px';

statusLabel.style.margin = '0';
statusLabel.style.fontFamily = 'Arial, sans-serif';
statusLabel.style.fontSize = '14px';

retryButton.type = 'button';
retryButton.textContent = 'Retry';
retryButton.hidden = true;

container.appendChild(statusBar);
statusBar.appendChild(statusLabel);
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

function setUiState({
  loading = false,
  hasError = false,
  message = '',
}: {
  loading?: boolean;
  hasError?: boolean;
  message?: string;
}) {
  statusLabel.textContent = message;
  statusLabel.style.color = hasError ? '#c62828' : '#202124';
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

async function fetchUsers(): Promise<ApiUser[]> {
  const response = await fetch('https://graphqlzero.almansi.me/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: USERS_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { users?: { data?: ApiUser[] } };
    errors?: Array<{ message?: string }>;
  };

  // GraphQL APIs can return HTTP 200 and still include execution errors.
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed.');
  }

  return payload.data?.users?.data ?? [];
}

async function loadUsers() {
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

retryButton.addEventListener('click', () => {
  loadUsers();
});

loadUsers();
