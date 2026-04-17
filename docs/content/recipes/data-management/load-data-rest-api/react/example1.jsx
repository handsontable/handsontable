import { useEffect, useMemo, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const STATUS_LOADING = 'Loading users...';
const STATUS_READY = 'Loaded users from REST API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

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

export default function ExampleComponent() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  const columns = useMemo(
    () => [
      { data: 'id', type: 'numeric', width: 70, readOnly: true },
      { data: 'name', type: 'text', width: 190, readOnly: true },
      { data: 'username', type: 'text', width: 150, readOnly: true },
      { data: 'email', type: 'text', width: 220, readOnly: true },
      { data: 'city', type: 'text', width: 140, readOnly: true },
      { data: 'company', type: 'text', width: 180, readOnly: true },
    ],
    []
  );

  const loadUsers = async () => {
    setLoading(true);
    setHasError(false);
    setStatus(STATUS_LOADING);

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const users = await response.json();

      setRows(mapUsersToGridRows(users));
      setStatus(STATUS_READY);
    } catch (_error) {
      setRows([]);
      setHasError(true);
      setStatus(STATUS_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: hasError
              ? 'var(--ht-cell-error-foreground-color, #c62828)'
              : 'var(--ht-foreground-color, #202124)',
          }}
        >
          {status}
        </p>
        <button type="button" hidden={!hasError} disabled={loading} onClick={loadUsers}>
          Retry
        </button>
      </div>
      <HotTable
        data={rows}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={columns}
        rowHeaders={true}
        height={360}
        width="100%"
        stretchH="all"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
}
