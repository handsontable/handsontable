import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

function buildUrl(base, params) {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

const container = document.querySelector('#example1');

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
      locale: 'en-US',
      numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
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

    fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
      const params = {
        page,
        pageSize,
        sortProp: sort?.prop,
        sortOrder: sort?.order,
        // Send the filter array as-is: [{ prop, operation, conditions: [{ name, args }] }].
        filters: filters ? JSON.stringify(filters) : undefined,
      };

      const url = buildUrl('/api/products', params);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      return { rows: json.rows, totalRows: json.totalRows };
    },

    onRowsCreate: async (payload) => {
      const res = await fetch('/api/products/create-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const info = data.map((r) => `(id: ${r.id})`).join(', ');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hot.getPlugin('notification').showMessage({
        variant: 'success',
        title: 'Row added',
        message: `Created: ${info}`,
        duration: 3000,
      });
      return data;
    },

    onRowsUpdate: async (rows) => {
      const res = await fetch('/api/products/update-rows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },

    onRowsRemove: async (rowIds) => {
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
  beforeRowsMutation(operation, payload) {
    if (operation === 'remove' && !removeConfirmed) {
      const count = payload.rowsRemove.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              removeConfirmed = true;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              hot
                .getPlugin('dataProvider')
                .removeRows(payload.rowsRemove)
                .finally(() => {
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

  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
