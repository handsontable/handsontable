import { useCallback, useEffect, useState } from 'react';
import { HotTable, HotTableProps } from '@handsontable/react-wrapper';
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

type UserRow = {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;
  company: string;
};

const STATUS_LOADING = 'Loading users...';
const STATUS_READY = 'Loaded users from REST API.';
const STATUS_ERROR = 'Failed to load users. Try again.';

const columns: HotTableProps['columns'] = [
  { data: 'id', type: 'numeric', width: 70, readOnly: true },
  { data: 'name', type: 'text', width: 190, readOnly: true },
  { data: 'username', type: 'text', width: 150, readOnly: true },
  { data: 'email', type: 'text', width: 220, readOnly: true },
  { data: 'city', type: 'text', width: 140, readOnly: true },
  { data: 'company', type: 'text', width: 180, readOnly: true },
];

const mapUsersToRows = (users: ApiUser[]): UserRow[] =>
  users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    city: user.address?.city ?? '',
    company: user.company?.name ?? '',
  }));

const ExampleComponent = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    setStatus(STATUS_LOADING);

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const users = (await response.json()) as ApiUser[];

      setRows(mapUsersToRows(users));
      setStatus(STATUS_READY);
    } catch (_error) {
      setRows([]);
      setHasError(true);
      setStatus(STATUS_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontSize: '14px', color: hasError ? 'var(--ht-cell-error-foreground-color, #c62828)' : 'var(--ht-foreground-color, #202124)' }}>
          {status}
        </p>
        {hasError && (
          <button type="button" disabled={loading} onClick={() => void loadUsers()}>
            Retry
          </button>
        )}
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
};

export default ExampleComponent;
