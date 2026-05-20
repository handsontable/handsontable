import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
// Serializes fetchRows query parameters into a URL query string that Rails
// reads via params[:page], params[:sort_prop], and params[:filters].
function buildUrl(base, { page, pageSize, sort, filters }) {
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
// dataProvider passes { position, referenceRowId, rowsAmount }, not row field
// values. Build placeholder orders that satisfy the Rails model validations.
function buildOrderRowsFromCreatePayload({ rowsAmount }) {
    const stamp = Date.now();
    return Array.from({ length: rowsAmount }, (_, i) => ({
        order_number: `ORD-NEW-${stamp}-${i}`,
        customer: 'New customer',
        status: 'pending',
        total: 0,
    }));
}
const container = document.querySelector('#example1');
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
    dataProvider: {
        rowId: 'id',
        fetchRows: async (queryParameters, { signal }) => {
            const url = buildUrl('/api/orders', queryParameters);
            const res = await fetch(url, { signal });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            return { rows: json.rows, totalRows: json.total_rows };
        },
        // Context-menu insert sends RowsCreatePayload; Rails create_rows expects
        // { rows: [ { order_number, customer, status, total }, ... ] }.
        onRowsCreate: async (payload) => {
            const rows = buildOrderRowsFromCreatePayload(payload);
            const res = await fetch('/api/orders/create_rows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows }),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            return json.rows;
        },
        // RowUpdatePayload.changes holds only the edited columns.
        onRowsUpdate: async (rows) => {
            const res = await fetch('/api/orders/update_rows', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rows: rows.map((r) => ({ id: r.id, changes: r.changes })),
                }),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
        },
        onRowsRemove: async (rowIds) => {
            const res = await fetch('/api/orders/remove_rows', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ row_ids: rowIds }),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
        },
    },
    pagination: { pageSize: 10 },
    columnSorting: true,
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
    emptyDataState: true,
    notification: true,
    colHeaders: ['Order #', 'Customer', 'Status', 'Total', 'Created'],
    columns: [
        { data: 'order_number', type: 'text' },
        { data: 'customer', type: 'text' },
        { data: 'status', type: 'text' },
        { data: 'total', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
        { data: 'created_at', type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
    ],
    rowHeaders: true,
    height: 400,
    width: '100%',
    licenseKey: 'non-commercial-and-evaluation',
});
export { hot };
