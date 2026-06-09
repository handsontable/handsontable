import { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
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
const STATUS_READY = 'Loaded users from GraphQL API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

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

const ExampleComponent = () => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [hasError, setHasError] = useState(false);

  const loadUsers = async () => {
    setStatus(STATUS_LOADING);
    setHasError(false);

    try {
      const users = await fetchUsers();

      setRows(mapUsersToGridRows(users));
      setStatus(STATUS_READY);
    } catch (_error) {
      setRows([]);
      setHasError(true);
      setStatus(STATUS_ERROR);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, []);

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          {hasError && (
            <button type="button" onClick={loadUsers} disabled={status === STATUS_LOADING}>
              Retry
            </button>
          )}
        </div>
        <output className={hasError ? 'is-error' : undefined}>{status}</output>
      </div>
      <HotTable
        data={rows}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={[
          { data: 'id', type: 'numeric', width: 70 },
          { data: 'name', type: 'text', width: 190 },
          { data: 'username', type: 'text', width: 150 },
          { data: 'email', type: 'text', width: 220 },
          { data: 'city', type: 'text', width: 140 },
          { data: 'company', type: 'text', width: 180 },
        ]}
        rowHeaders={true}
        height={360}
        width="100%"
        stretchH="all"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
