import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

registerAllModules();

// Sends a GraphQL request to POST /graphql and returns response.data.
// Throws on HTTP errors and on GraphQL-level errors so notification: true
// can display an error toast automatically.
async function gql(query: string, variables: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as { data: Record<string, unknown>; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// --- GraphQL operations ---

const FETCH_PRODUCTS = `
  query FetchProducts($page: Int, $pageSize: Int, $sort: SortInput, $filters: [FilterInput!]) {
    products(page: $page, pageSize: $pageSize, sort: $sort, filters: $filters) {
      data { id name sku category price stock sort_order }
      total
    }
  }
`;

const CREATE_PRODUCTS = `
  mutation CreateProducts($rowsAmount: Int, $position: String, $referenceRowId: Int) {
    createProducts(rowsAmount: $rowsAmount, position: $position, referenceRowId: $referenceRowId) {
      id name sku category price stock sort_order
    }
  }
`;

const UPDATE_PRODUCTS = `
  mutation UpdateProducts($rows: [ProductUpdateInput!]!) {
    updateProducts(rows: $rows)
  }
`;

const DELETE_PRODUCTS = `
  mutation DeleteProducts($ids: [Int!]!) {
    deleteProducts(ids: $ids)
  }
`;

interface FilterInput {
  prop:       string;
  condition:  string;
  value:      string | null;
  value2:     string | null;
}

interface HotFilter {
  prop:       string;
  conditions: { name: string; args: (string | number)[] }[];
}

// Converts Handsontable's filters shape — [{ prop, conditions: [{ name, args }] }] —
// to the flat FilterInput array the GraphQL schema expects.
function mapFilters(filters: HotFilter[]): FilterInput[] {
  const result: FilterInput[] = [];
  filters.forEach(({ prop, conditions }) => {
    (conditions || []).forEach(({ name, args }) => {
      if (!name) return;
      const a = args ?? [];
      result.push({
        prop,
        condition: name,
        value:     a[0] != null ? String(a[0]) : null,
        value2:    a[1] != null ? String(a[1]) : null,
      });
    });
  });
  return result;
}

const container = document.querySelector('#example1')!;

let removeConfirmed = false;

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    fetchRows: async (queryParameters: DataProviderQueryParameters, { signal }: { signal: AbortSignal }) => {
      const { page, pageSize, sort, filters } = queryParameters;
      const data = await gql(FETCH_PRODUCTS, {
        page,
        pageSize,
        sort:    sort    ? { prop: sort.prop, order: sort.order } : null,
        filters: filters ? mapFilters(filters as HotFilter[]) : null,
      });
      const products = data['products'] as { data: object[]; total: number };
      return { rows: products.data, totalRows: products.total };
    },

    onRowsCreate: async (payload) => {
      const typedPayload = payload as { rowsAmount: number; position: 'above' | 'below'; referenceRowId?: number };
      const data = await gql(CREATE_PRODUCTS, {
        rowsAmount:     typedPayload.rowsAmount,
        position:       typedPayload.position,
        referenceRowId: typedPayload.referenceRowId ?? null,
      });

      const rows = data['createProducts'] as Record<string, unknown>[];
      const row = rows[0];
      hot.getPlugin('notification').showMessage({
        variant:  'success',
        title:    'Row added',
        message:  `Created: ${row['sku']} (id: ${row['id']})`,
        duration: 3000,
      });

      // Return the created rows so dataProvider can update its row map with
      // server-assigned ids.
      return rows;
    },

    onRowsUpdate: async (rows) => {
      await gql(UPDATE_PRODUCTS, {
        rows: (rows as { id: number; changes: Record<string, unknown> }[]).map(({ id, changes }) => ({ id, changes })),
      });
    },

    onRowsRemove: async (rowIds) => {
      await gql(DELETE_PRODUCTS, { ids: rowIds });
    },
  },

  beforeRowsMutation(operation, payload) {
    if (operation === 'remove' && !removeConfirmed) {
      const rowsRemove = (payload as { rowsRemove: unknown[] }).rowsRemove;
      const count = rowsRemove.length;
      const notification = hot.getPlugin('notification');
      const id = notification.showMessage({
        variant:  'warning',
        title:    'Delete rows',
        message:  `Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`,
        duration: 0,
        actions: [
          {
            label: 'Delete',
            type:  'primary',
            callback: () => {
              notification.hide(id);
              removeConfirmed = true;
              hot.getPlugin('dataProvider').removeRows(rowsRemove).finally(() => {
                removeConfirmed = false;
              });
            },
          },
          {
            label:    'Cancel',
            type:     'secondary',
            callback: () => notification.hide(id),
          },
        ],
      });
      return false;
    }
  },

  pagination:    { pageSize: 10 },
  columnSorting: true,
  filters:       true,
  dropdownMenu:  true,
  contextMenu:   true,
  emptyDataState: true,
  notification:  true,

  width:      '100%',
  height:     'auto',
  rowHeaders: true,
  colHeaders: ['Name', 'SKU', 'Category', 'Price', 'Stock'],
  columns: [
    { data: 'name',     type: 'text' },
    { data: 'sku',      type: 'text', readOnly: true },
    { data: 'category', type: 'dropdown', source: ['Electronics', 'Accessories', 'Storage', 'Networking', 'Peripherals'] },
    { data: 'price',    type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    { data: 'stock',    type: 'numeric' },
  ],
  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);

document.getElementById('btn-filter-empty')!.addEventListener('click', () => {
  const filters = hot.getPlugin('filters');
  filters.clearConditions();
  filters.addCondition(2, 'eq', ['Electronics']);
  filters.filter();
});

document.getElementById('btn-clear-filters')!.addEventListener('click', () => {
  const filters = hot.getPlugin('filters');
  filters.clearConditions();
  filters.filter();
});

export default hot;
