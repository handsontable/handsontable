import { useCallback, useMemo, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

/**
 * Converts Handsontable's DataProviderQueryParameters into a URL query string
 * that the Express backend can parse via Zod's safeParse.
 *
 * Express with Zod expects nested objects as bracket notation in the query string:
 *   sort[column]=status&sort[order]=asc
 *   filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
 *
 * Each DataProviderFilterColumn can have multiple conditions (e.g. between),
 * so we flatten them: one entry per condition, incrementing the index.
 */
function buildUrl(params) {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.prop);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters && params.filters.length > 0) {
    let idx = 0;

    params.filters.forEach((filter) => {
      filter.conditions.forEach((cond) => {
        query.set(`filters[${idx}][prop]`, filter.prop);
        query.set(`filters[${idx}][condition]`, cond.name);

        cond.args.forEach((arg, j) => {
          query.set(`filters[${idx}][value][${j}]`, String(arg));
        });

        idx++;
      });
    });
  }

  return `/tickets?${query.toString()}`;
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

const ExampleComponent = () => {
  const [status, setStatus] = useState('');

  const fetchRows = useCallback(async (params, { signal }) => {
    const res = await fetch(buildUrl(params), { signal });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    return res.json();
  }, []);

  const onRowsCreate = useCallback(async ({ rowsAmount }) => {
    const rows = Array.from({ length: rowsAmount }, () => ({
      subject: '',
      status: 'open',
      priority: 'medium',
      assignee: '',
      createdAt: new Date().toISOString().slice(0, 10),
    }));

    const res = await fetch('/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    return res.json();
  }, []);

  const onRowsUpdate = useCallback(async (rows) => {
    const payload = rows.map(({ id, changes }) => ({ id, ...changes }));
    const res = await fetch('/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }, []);

  const onRowsRemove = useCallback(async (rowIds) => {
    const res = await fetch('/tickets', {
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
        contextMenu={true}
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
          { data: 'createdAt', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }, width: 110 },
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
