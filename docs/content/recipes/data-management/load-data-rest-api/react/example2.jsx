import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const EMPTY_DATA = [];

const STATUS_LOADING = 'Loading users...';
const STATUS_READY =
  'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
const STATUS_REFRESHING = 'Refreshing...';
const STATUS_REFRESHED = 'Data refreshed -- column sort order was preserved.';
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

async function fetchUsers() {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }

  return response.json();
}

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

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

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    setStatus(STATUS_LOADING);

    try {
      const users = await fetchUsers();

      hotRef.current?.hotInstance?.loadData(mapUsersToGridRows(users));
      setHasData(true);
      setStatus(STATUS_READY);
    } catch (_error) {
      hotRef.current?.hotInstance?.loadData([]);
      setHasError(true);
      setStatus(STATUS_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    setStatus(STATUS_REFRESHING);

    try {
      const users = await fetchUsers();

      hotRef.current?.hotInstance?.updateData(mapUsersToGridRows(users));
      setStatus(STATUS_REFRESHED);
    } catch (_error) {
      setHasError(true);
      setStatus(STATUS_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

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
        {hasData && !hasError && !loading && (
          <button type="button" onClick={() => void refreshUsers()}>
            Refresh
          </button>
        )}
        {hasError && (
          <button type="button" disabled={loading} onClick={() => void initialLoad()}>
            Retry
          </button>
        )}
      </div>

      <HotTable
        ref={hotRef}
        data={EMPTY_DATA}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={columns}
        columnSorting={true}
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
