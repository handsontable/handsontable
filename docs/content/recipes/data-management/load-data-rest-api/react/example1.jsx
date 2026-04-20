import { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const STATUS_LOADING = 'Loading users...';
const STATUS_READY = 'Loaded users from REST API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

async function fetchUsers() {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }

  return response.json();
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
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontSize: '14px', color: hasError ? '#c62828' : '#202124' }}>
          {status}
        </p>
        {hasError && (
          <button type="button" onClick={loadUsers}>
            Retry
          </button>
        )}
      </div>
      <HotTable
        data={rows}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={[
          { data: 'id', type: 'numeric', width: 70, readOnly: true },
          { data: 'name', type: 'text', width: 190, readOnly: true },
          { data: 'username', type: 'text', width: 150, readOnly: true },
          { data: 'email', type: 'text', width: 220, readOnly: true },
          { data: 'city', type: 'text', width: 140, readOnly: true },
          { data: 'company', type: 'text', width: 180, readOnly: true },
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
