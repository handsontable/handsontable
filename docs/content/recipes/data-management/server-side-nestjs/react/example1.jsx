import { useCallback, useMemo, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

/**
 * Converts Handsontable's DataProviderQueryParameters into a URL query string
 * that the NestJS backend can parse with @Query() and class-transformer.
 *
 * Handsontable passes `params` to fetchRows every time the page, sort, or
 * filters change. The shape is:
 *
 *   {
 *     page: 1,
 *     pageSize: 10,
 *     sort: { prop: 'status', order: 'asc' } | undefined,
 *     filters: [{ prop: 'status', condition: 'eq', value: ['open'] }] | undefined,
 *   }
 *
 * NestJS expects nested objects as bracket notation in the query string:
 *   sort[column]=status&sort[order]=asc
 *   filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][]=open
 */
function buildUrl(base, params) {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.prop);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters && params.filters.length > 0) {
    params.filters.forEach((filter, i) => {
      query.set(`filters[${i}][prop]`, filter.prop);
      query.set(`filters[${i}][condition]`, filter.condition);

      filter.value.forEach((v, j) => {
        query.set(`filters[${i}][value][${j}]`, String(v));
      });
    });
  }

  return `${base}?${query.toString()}`;
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

const ExampleComponent = () => {
  const [status, setStatus] = useState('');

  const fetchRows = useCallback(async (params, { signal }) => {
    const url = buildUrl('http://localhost:3000/tickets', params);
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    return res.json();
  }, []);

  const onRowsCreate = useCallback(async (payload) => {
    const res = await fetch('http://localhost:3000/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    return res.json();
  }, []);

  const onRowsUpdate = useCallback(async (rows) => {
    const res = await fetch('http://localhost:3000/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }, []);

  const onRowsRemove = useCallback(async (rowIds) => {
    const res = await fetch('http://localhost:3000/tickets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }
  }, []);

  const dataProvider = useMemo(
    () => ({
      rowId: 'id',
      fetchRows,
      onRowsCreate,
      onRowsUpdate,
      onRowsRemove,
    }),
    [fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove]
  );

  return (
    <div>
      {status && <div id="status-label">{status}</div>}
      <HotTable
        dataProvider={dataProvider}
        pagination={{ pageSize: 5 }}
        columnSorting={true}
        filters={true}
        dropdownMenu={true}
        emptyDataState={true}
        notification={true}
        colHeaders={['ID', 'Subject', 'Status', 'Priority', 'Assignee', 'Created']}
        columns={[
          { data: 'id', type: 'text', readOnly: true, width: 50 },
          { data: 'subject', type: 'text', width: 280 },
          {
            data: 'status',
            type: 'dropdown',
            source: ['open', 'in-progress', 'resolved', 'closed'],
            width: 110,
          },
          {
            data: 'priority',
            type: 'dropdown',
            source: ['low', 'medium', 'high', 'critical'],
            width: 90,
          },
          { data: 'assignee', type: 'text', width: 140 },
          { data: 'createdAt', type: 'date', dateFormat: 'YYYY-MM-DD', width: 110 },
        ]}
        rowHeaders={true}
        height="auto"
        width="100%"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
        afterDataProviderFetch={(result) => {
          setStatus(`${result.totalRows} tickets total`);
        }}
      />
    </div>
  );
};

export default ExampleComponent;
