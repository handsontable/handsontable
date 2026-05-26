import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// Serializes fetchRows query parameters into a URL the Rails controller understands.
//
// Handsontable sends:
//   sort:    { prop: 'order_number', order: 'asc' }  or  null
//   filters: [{ prop, conditions: [{ name, args }] }]  or  null
//
// Rails reads:
//   page_size (not pageSize), sort_prop, sort_order,
//   filters[0][prop], filters[0][condition], filters[0][value]
function buildUrl(base, { page, pageSize, sort, filters }) {
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
        params.set(`filters[${idx}][value]`, args?.[0] ?? '');
        idx++;
      });
    });
  }

  return `${base}?${params.toString()}`;
}

const API_BASE = '/api/orders';

const container = document.querySelector('#example1');

let removeConfirmed = false;

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    // fetchRows is called on every page change, sort, and filter.
    fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
      const url = buildUrl(API_BASE, { page, pageSize, sort, filters });
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      // Rails returns: { rows: [...], total_rows: n }
      const json = await res.json();

      return { rows: json.rows, totalRows: json.total_rows };
    },

    // onRowsCreate fires when the user inserts rows from the context menu.
    onRowsCreate: async ({ rowsAmount }) => {
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
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Create failed: ${res.status}`);
      }

      const json = await res.json();
      const info = json.rows.map(r => `(order: ${r.order_number})`).join(', ');
      hot.getPlugin('notification').showMessage({
        variant: 'success',
        title: 'Row added',
        message: `Created: ${info}`,
        duration: 3000,
      });
      return json.rows;
    },

    // onRowsUpdate fires after a cell edit.
    // rows is an array of { id, changes, rowData } objects.
    onRowsUpdate: async (rows) => {
      const res = await fetch(`${API_BASE}/update_rows`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rows.map((r) => ({ id: r.id, changes: r.changes })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Update failed: ${res.status}`);
      }
    },

    // onRowsRemove fires after the user confirms deletion.
    onRowsRemove: async (rowIds) => {
      const res = await fetch(`${API_BASE}/remove_rows`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row_ids: rowIds }),
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    },
  },

  // beforeRowsMutation is sync (checks for strict === false return).
  // Cancel the first attempt, show a notification with Delete/Cancel actions,
  // and on Delete re-issue the remove via the DataProvider API.
  beforeRowsMutation(operation, payload) {
    if (operation === 'remove' && !removeConfirmed) {
      const count = payload.rowsRemove.length;
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
              hot.getPlugin('dataProvider').removeRows(payload.rowsRemove).finally(() => {
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

  pagination:     { pageSize: 10 },
  columnSorting:  true,
  filters:        true,
  dropdownMenu:   ['filter_by_condition', 'filter_action_bar'],
  contextMenu:    true,
  emptyDataState: true,
  notification:   true,
  dialog:         true,

  colHeaders: ['Order #', 'Customer', 'Status', 'Total', 'Created'],
  columns: [
    { data: 'order_number', type: 'text' },
    { data: 'customer',     type: 'text' },
    { data: 'status',       type: 'text' },
    { data: 'total',        type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
    { data: 'created_at',   type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
  ],

  rowHeaders:  true,
  height:      'auto',
  licenseKey:  'non-commercial-and-evaluation',
});

export default hot;
