import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
}

interface HotFilter {
  column: string;
  value: string;
}

interface ProductQueryParams {
  page: number;
  pageSize: number;
  sortProp?: string;
  sortOrder?: string;
  filters?: string;
}

function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

const container = document.querySelector('#example1')!;

let removeConfirmed = false;

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  columns: [
    { data: 'id', title: 'ID', readOnly: true, width: 60 },
    { data: 'name', title: 'Name', width: 200 },
    { data: 'sku', title: 'SKU', width: 120 },
    { data: 'category', title: 'Category', width: 130 },
    {
      data: 'price',
      title: 'Price',
      type: 'numeric',
      numericFormat: { pattern: '0,0.00', culture: 'en-US' },
      width: 100,
    },
    { data: 'stock', title: 'Stock', type: 'numeric', width: 80 },
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 450,
  width: '100%',
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  contextMenu: true,
  pagination: { pageSize: 10 },
  emptyDataState: true,
  notification: true,

  dataProvider: {
    rowId: 'id',

    fetchRows: async (
      { page, pageSize, sort, filters }: {
        page: number;
        pageSize: number;
        sort?: { prop: string; order: string };
        filters?: HotFilter[];
      },
      { signal }: { signal: AbortSignal }
    ): Promise<{ rows: Product[]; totalRows: number }> => {
      const params: ProductQueryParams = {
        page,
        pageSize,
        sortProp: sort?.prop,
        sortOrder: sort?.order,
        filters: filters ? JSON.stringify(filters) : undefined,
      };

      const url = buildUrl('/api/products', params as Record<string, string | number | undefined>);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      return { rows: json.rows as Product[], totalRows: json.totalRows as number };
    },

    onRowsCreate: async (payload: { position: 'above' | 'below'; referenceRowId: number; rowsAmount: number }): Promise<Product[]> => {
      const res = await fetch('/api/products/create-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as Product[];
      const info = data.map(r => `(id: ${r.id})`).join(', ');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (hot.getPlugin('notification') as any).showMessage({
        variant: 'success',
        title: 'Row added',
        message: `Created: ${info}`,
        duration: 3000,
      });
      return data;
    },

    onRowsUpdate: async (rows: Array<{ id: number; changes: Partial<Product> }>): Promise<void> => {
      const res = await fetch('/api/products/update-rows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },

    onRowsRemove: async (rowIds: number[]): Promise<void> => {
      const res = await fetch('/api/products/remove-rows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowIds),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
  },

  // beforeRowsMutation is sync (checks for a strict `=== false` return), so
  // we can't await an async prompt inline. Instead: cancel the original
  // attempt, show a notification with Delete/Cancel actions, and on Delete
  // re-issue the remove via the DataProvider API. The flag lets the second
  // pass through without re-prompting.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeRowsMutation(operation: string, payload: any): false | void {
    if (operation === 'remove' && !removeConfirmed) {
      const count = payload.rowsRemove.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notification = (hot.getPlugin('notification') as any);
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
              removeConfirmed = true;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (hot.getPlugin('dataProvider') as any).removeRows(payload.rowsRemove).finally(() => {
                removeConfirmed = false;
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
  },

  licenseKey: 'non-commercial-and-evaluation',
} as Handsontable.GridSettings);
