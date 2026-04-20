import { useState, useEffect, useRef } from 'react';
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
const STATUS_READY =
  'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
const STATUS_REFRESHING = 'Refreshing...';
const STATUS_REFRESHED = 'Data refreshed -- column sort order was preserved.';
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
  const hotRef = useRef(null);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [hasError, setHasError] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  // Step 5: Initial load uses loadData() via the hot instance, which resets all grid states.
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

  // Step 6: Subsequent refreshes use updateData(), which replaces the data
  // without resetting column sort order, selection, or column order.
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
      // On error, do not clear the grid -- the existing data is still valid.
      setHasError(true);
      setStatus(STATUS_ERROR);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { initialLoad(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontSize: '14px', color: hasError ? '#c62828' : '#202124' }}>
          {status}
        </p>
        {showRefresh && !hasError && (
          <button type="button" onClick={refreshUsers} style={{ marginBottom: 0 }}>
            Refresh
          </button>
        )}
        {hasError && (
          <button type="button" onClick={initialLoad} style={{ marginBottom: 0 }}>
            Retry
          </button>
        )}
      </div>
      <HotTable
        ref={hotRef}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={[
          { data: 'id', type: 'numeric', width: 70 },
          { data: 'name', type: 'text', width: 190 },
          { data: 'username', type: 'text', width: 150 },
          { data: 'email', type: 'text', width: 220 },
          { data: 'city', type: 'text', width: 140 },
          { data: 'company', type: 'text', width: 180 },
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
