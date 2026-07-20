import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
  RowsCreatePayload,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

import { supabase } from './supabase';
import { applyFilters } from './filterAdapter';

registerAllModules();

async function fetchRows(
  { page, pageSize, sort, filters }: DataProviderQueryParameters,
  { signal }: DataProviderFetchOptions,
): Promise<DataProviderFetchResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('inventory')
    .select('*', { count: 'exact' })
    .range(from, to)
    .abortSignal(signal);

  if (sort) {
    query = query.order(sort.prop, { ascending: sort.order === 'asc' });
  }

  query = applyFilters(query, filters);

  const { data, count, error } = await query;

  if (signal.aborted) {
    return { rows: [], totalRows: 0 };
  }

  if (error) {
    throw error;
  }

  return { rows: data ?? [], totalRows: count ?? 0 };
}

async function onRowsCreate({ rowsAmount }: RowsCreatePayload): Promise<unknown[]> {
  const newRows = Array.from({ length: rowsAmount }, () => ({
    sku: 'NEW-000',
    name: 'New item',
    quantity: 0,
    warehouse: 'East',
  }));

  const { data, error } = await supabase.from('inventory').insert(newRows).select();

  if (error) {
    throw error;
  }

  return data;
}

async function onRowsUpdate(rows: RowUpdatePayload[]): Promise<unknown[]> {
  const results = await Promise.all(
    rows.map(({ id, changes }) =>
      supabase.from('inventory').update(changes).eq('id', id).select().single(),
    ),
  );

  const failed = results.find((result) => result.error);

  if (failed) {
    throw failed.error;
  }

  return results.map((result) => result.data);
}

async function onRowsRemove(rowIds: string[]): Promise<void> {
  const { error } = await supabase.from('inventory').delete().in('id', rowIds);

  if (error) {
    throw error;
  }
}

const ExampleComponent = () => {
  return (
    <HotTable
      themeName="ht-theme-main"
      dataProvider={{
        rowId: 'id',
        fetchRows,
        onRowsCreate,
        onRowsUpdate,
        onRowsRemove,
      }}
      colHeaders={['ID', 'SKU', 'Name', 'Quantity', 'Unit price', 'Warehouse', 'Updated at']}
      columns={[
        { data: 'id', type: 'text', readOnly: true, width: 260 },
        { data: 'sku', type: 'text', width: 100 },
        { data: 'name', type: 'text', width: 180 },
        { data: 'quantity', type: 'numeric', width: 90 },
        { data: 'unit_price', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 110 },
        { data: 'warehouse', type: 'text', width: 110 },
        { data: 'updated_at', type: 'text', readOnly: true, width: 200 },
      ]}
      hiddenColumns={{ columns: [0] }}
      fixedColumnsStart={2}
      pagination={{ pageSize: 10 }}
      columnSorting={true}
      filters={true}
      dropdownMenu={['filter_by_condition', 'filter_action_bar']}
      notification={true}
      emptyDataState={true}
      contextMenu={true}
      rowHeaders={true}
      height={500}
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
