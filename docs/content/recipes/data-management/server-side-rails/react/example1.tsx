import { useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
  DataProviderFetchResult,
  RowUpdatePayload,
  RowsCreatePayload,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

function buildUrl(base: string, { page, pageSize, sort, filters }: DataProviderQueryParameters): string {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('page_size', String(pageSize));

  if (sort?.prop) {
    params.set('sort_prop', sort.prop);
    params.set('sort_order', sort.order ?? 'asc');
  }

  if (filters?.length) {
    filters.forEach((filter, i) => {
      const condition = filter.conditions[0];

      params.set(`filters[${i}][prop]`, filter.prop);

      if (condition?.name) {
        params.set(`filters[${i}][condition]`, condition.name);
      }

      if (condition?.args?.[0] != null) {
        params.set(`filters[${i}][value]`, String(condition.args[0]));
      }

      if (condition?.args?.[1] != null) {
        params.set(`filters[${i}][value2]`, String(condition.args[1]));
      }
    });
  }

  return `${base}?${params.toString()}`;
}

function buildOrderRowsFromCreatePayload({ rowsAmount }: RowsCreatePayload) {
  const stamp = Date.now();

  return Array.from({ length: rowsAmount }, (_, i) => ({
    order_number: `ORD-NEW-${stamp}-${i}`,
    customer: 'New customer',
    status: 'pending',
    total: 0,
  }));
}

const ExampleComponent = () => {
  const fetchRows = useCallback(
    async (
      params: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl('/api/orders', params);
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json() as { rows: unknown[]; total_rows: number };

      return { rows: json.rows, totalRows: json.total_rows };
    },
    []
  );

  const onRowsCreate = useCallback(async (payload: RowsCreatePayload): Promise<unknown> => {
    const rows = buildOrderRowsFromCreatePayload(payload);
    const res = await fetch('/api/orders/create_rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as { rows: unknown[] };

    return json.rows;
  }, []);

  const onRowsUpdate = useCallback(async (rows: RowUpdatePayload[]): Promise<void> => {
    const res = await fetch('/api/orders/update_rows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: rows.map((r) => ({ id: r.id, changes: r.changes })),
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }, []);

  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    const res = await fetch('/api/orders/remove_rows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row_ids: rowIds }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      <HotTable
        dataProvider={dataProvider}
        pagination={{ pageSize: 10 }}
        columnSorting={true}
        filters={true}
        dropdownMenu={['filter_by_condition', 'filter_action_bar']}
        emptyDataState={true}
        notification={true}
        colHeaders={['Order #', 'Customer', 'Status', 'Total', 'Created']}
        columns={[
          { data: 'order_number', type: 'text' },
          { data: 'customer', type: 'text' },
          { data: 'status', type: 'text' },
          { data: 'total', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
          { data: 'created_at', type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
        ]}
        rowHeaders={true}
        height={400}
        width="100%"
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
