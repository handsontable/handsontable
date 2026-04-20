import { useCallback, useMemo, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const ExampleComponent = () => {
  const cachedRowsRef = useRef(null);
  const [status, setStatus] = useState('Loading...');
  const [statusColor, setStatusColor] = useState('#202124');

  const loadAllRows = useCallback(async (signal) => {
    if (cachedRowsRef.current !== null) {
      return cachedRowsRef.current;
    }

    const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const users = await response.json();

    cachedRowsRef.current = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      city: u.address?.city ?? '',
      company: u.company?.name ?? '',
    }));

    return cachedRowsRef.current;
  }, []);

  const fetchRows = useCallback(
    async ({ page, pageSize, sort }, { signal }) => {
      let rows = await loadAllRows(signal);

      if (sort) {
        rows = [...rows].sort((a, b) => {
          const av = a[sort.prop];
          const bv = b[sort.prop];
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;

          return sort.order === 'asc' ? cmp : -cmp;
        });
      }

      const start = (page - 1) * pageSize;

      return {
        rows: rows.slice(start, start + pageSize),
        totalRows: rows.length,
      };
    },
    [loadAllRows]
  );

  const dataProvider = useMemo(
    () => ({
      rowId: 'id',
      fetchRows,
      onRowsCreate: async () => {},
      onRowsUpdate: async () => {},
      onRowsRemove: async () => {},
    }),
    [fetchRows]
  );

  const beforeDataProviderFetch = useCallback((params) => {
    if (!params.skipLoading) {
      setStatus('Loading...');
      setStatusColor('#202124');
    }
  }, []);

  const afterDataProviderFetch = useCallback(() => {
    setStatus('Loaded from REST API via dataProvider.');
    setStatusColor('#202124');
  }, []);

  const afterDataProviderFetchError = useCallback((error) => {
    setStatus(`Error: ${error.message}`);
    setStatusColor('#c62828');
  }, []);

  return (
    <div>
      <p style={{ margin: '0 0 8px', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: statusColor }}>
        {status}
      </p>
      <HotTable
        dataProvider={dataProvider}
        colHeaders={['ID', 'Name', 'Username', 'Email', 'City', 'Company']}
        columns={[
          { data: 'id', type: 'numeric', width: 70, readOnly: true },
          { data: 'name', type: 'text', width: 190, readOnly: true },
          { data: 'username', type: 'text', width: 150, readOnly: true },
          { data: 'email', type: 'text', width: 220, readOnly: true },
          { data: 'city', type: 'text', width: 140, readOnly: true },
          { data: 'company', type: 'text', width: 180, readOnly: true },
        ]}
        pagination={{ pageSize: 5 }}
        columnSorting={true}
        emptyDataState={true}
        rowHeaders={true}
        height={360}
        width="100%"
        stretchH="all"
        autoWrapRow={true}
        beforeDataProviderFetch={beforeDataProviderFetch}
        afterDataProviderFetch={afterDataProviderFetch}
        afterDataProviderFetchError={afterDataProviderFetchError}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
