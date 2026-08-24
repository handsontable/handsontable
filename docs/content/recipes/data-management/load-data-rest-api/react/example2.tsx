import { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
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
const STATUS_READY =
  'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
const STATUS_REFRESHING = 'Refreshing...';
const STATUS_REFRESHED = 'Data refreshed -- column sort order was preserved.';
const STATUS_ERROR = 'Failed to load users. Try again.';

async function fetchUsers(): Promise<ApiUser[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }

  return response.json() as Promise<ApiUser[]>;
}

function mapUsersToGridRows(users: ApiUser[]): UserRow[] {
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
  const hotRef = useRef<InstanceType<typeof HotTable>>(null);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [hasError, setHasError] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  const initialLoad = async () => {
    setStatus(STATUS_LOADING);
    setHasError(false);
    setShowRefresh(false);

    try {
      const users = await fetchUsers();

      hotRef.current?.hotInstance?.loadData(mapUsersToGridRows(users));
      setStatus(STATUS_READY);
      setShowRefresh(true);
    } catch (_error) {
      hotRef.current?.hotInstance?.loadData([]);
      setHasError(true);
      setStatus(STATUS_ERROR);
    }
  };

  const refreshUsers = async () => {
    setStatus(STATUS_REFRESHING);
    setHasError(false);
    setShowRefresh(false);

    try {
      const users = await fetchUsers();

      hotRef.current?.hotInstance?.updateData(mapUsersToGridRows(users));
      setStatus(STATUS_REFRESHED);
      setShowRefresh(true);
    } catch (_error) {
      setHasError(true);
      setStatus(STATUS_ERROR);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { initialLoad(); }, []);

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          {showRefresh && !hasError && (
            <button
              type="button"
              onClick={refreshUsers}
              disabled={status === STATUS_LOADING || status === STATUS_REFRESHING}
            >
              Refresh
            </button>
          )}
          {hasError && (
            <button
              type="button"
              onClick={initialLoad}
              disabled={status === STATUS_LOADING || status === STATUS_REFRESHING}
            >
              Retry
            </button>
          )}
        </div>
        <output className={hasError ? 'is-error' : undefined}>{status}</output>
      </div>
      <HotTable
        ref={hotRef}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={[
          { data: 'id', type: 'numeric', width: 70, readOnly: true },
          { data: 'name', type: 'text', width: 190, readOnly: true },
          { data: 'username', type: 'text', width: 150, readOnly: true },
          { data: 'email', type: 'text', width: 220, readOnly: true },
          { data: 'city', type: 'text', width: 140, readOnly: true },
          { data: 'company', type: 'text', width: 180, readOnly: true },
        ]}
        columnSorting={true}
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
