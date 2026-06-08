import { useCallback, useMemo, useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

const API_BASE = '/api/orders';

interface RailsResponse {
  rows: object[];
  total_rows: number;
}

// Serializes fetchRows query parameters into a URL the Rails controller understands.
//
// Handsontable sends:
//   sort:    { prop: 'order_number', order: 'asc' }  or  null
//   filters: [{ prop, conditions: [{ name, args }] }]  or  null
//
// Rails reads:
//   page_size, sort_prop, sort_order, filters[N][prop/condition/value]
function buildUrl(base: string, { page, pageSize, sort, filters }: DataProviderQueryParameters): string {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('page_size', String(pageSize));

  if (sort?.prop) {
    params.set('sort_prop', sort.prop);
    params.set('sort_order', sort.order ?? 'asc');
  }

  if (filters?.length) {
    let idx = 0;
    filters.forEach(({ prop, conditions }) => {
      (conditions || []).forEach(({ name, args }) => {
        if (!name) return;
        params.set(`filters[${idx}][prop]`, prop);
        params.set(`filters[${idx}][condition]`, name);
        const a = args ?? [];
        if (a[0] != null) params.set(`filters[${idx}][value]`, String(a[0]));
        idx++;
      });
    });
  }

  return `${base}?${params.toString()}`;
}

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const removeConfirmedRef = useRef(false);

  const fetchRows = useCallback(
    async (params: DataProviderQueryParameters, { signal }: DataProviderFetchOptions): Promise<DataProviderFetchResult> => {
      const url = buildUrl(API_BASE, params);
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const json = await res.json() as RailsResponse;

      return { rows: json.rows, totalRows: json.total_rows };
    },
    []
  );

  const onRowsCreate = useCallback(async (payload: unknown): Promise<unknown[]> => {
    const { rowsAmount } = payload as { rowsAmount: number };
    const newRows = Array.from({ length: rowsAmount }, () => ({
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      customer: 'New Customer',
      status: 'pending',
      total: 0,
    }));

    const res = await fetch(`${API_BASE}/create_rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: newRows }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Create failed: ${res.status}`);
    }

    const json = await res.json() as { rows: Array<{ order_number: string }> };
    const info = json.rows.map(r => `(order: ${r.order_number})`).join(', ');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hotRef.current?.hotInstance?.getPlugin('notification') as any)?.showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${info}`,
      duration: 3000,
    });
    return json.rows;
  }, []);

  const onRowsUpdate = useCallback(async (rows: unknown): Promise<void> => {
    const payload = (rows as { id: unknown; changes: unknown }[]).map((r) => ({
      id: r.id,
      changes: r.changes,
    }));
    const res = await fetch(`${API_BASE}/update_rows`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: payload }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Update failed: ${res.status}`);
    }
  }, []);

  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    const res = await fetch(`${API_BASE}/remove_rows`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row_ids: rowIds }),
    });

    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  }, []);

  const dataProvider = useMemo(
    () => ({ rowId: 'id', fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove }),
    [fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove]
  );

  const beforeRowsMutation = useCallback((operation: string, payload: { rowsRemove: unknown[] }) => {
    if (operation === 'remove' && !removeConfirmedRef.current) {
      const count = payload.rowsRemove.length;
      const hot = hotRef.current?.hotInstance;
      if (!hot) return false;

      const notification = hot.getPlugin('notification');
      const id = notification.showMessage({
        variant: 'warning',
        title: 'Delete rows',
        message: `Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`,
        duration: 0,
        actions: [
          {
            label: 'Delete',
            type: 'primary',
            callback: () => {
              notification.hide(id);
              removeConfirmedRef.current = true;
              hot.getPlugin('dataProvider').removeRows(payload.rowsRemove).finally(() => {
                removeConfirmedRef.current = false;
              });
            },
          },
          {
            label: 'Cancel',
            type: 'secondary',
            callback: () => notification.hide(id),
          },
        ],
      });
      return false;
    }
  }, []);

  return (
    <div>
      <HotTable
        ref={hotRef}
        dataProvider={dataProvider}
        beforeRowsMutation={beforeRowsMutation}
        pagination={{ pageSize: 10 }}
        columnSorting={true}
        filters={true}
        dropdownMenu={['filter_by_condition', 'filter_action_bar']}
        contextMenu={true}
        emptyDataState={true}
        notification={true}
        dialog={true}
        colHeaders={['Order #', 'Customer', 'Status', 'Total', 'Created']}
        columns={[
          { data: 'order_number', type: 'text' },
          { data: 'customer',     type: 'text' },
          { data: 'status',       type: 'text' },
          { data: 'total',        type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
          { data: 'created_at',   type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }, readOnly: true },
        ]}
        rowHeaders={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
