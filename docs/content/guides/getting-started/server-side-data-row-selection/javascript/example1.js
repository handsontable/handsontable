import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const STATUSES = ['Pending', 'Paid', 'Shipped', 'Cancelled'];
const CUSTOMERS = ['Harbor Goods', 'Alpine Supply Co.', 'Cascade Distributors', 'Summit Trading', 'Nordic Traders'];

// An in-memory "server" with 40 orders. Replace it with requests to your API.
const serverOrders = Array.from({ length: 40 }, (_, index) => ({
  id: 1001 + index,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  status: STATUSES[index % STATUSES.length],
  total: 25 + ((index * 37) % 400),
}));

const fetchOrders = async({ page, pageSize }) => ({
  rows: serverOrders.slice((page - 1) * pageSize, page * pageSize),
  totalRows: serverOrders.length,
});

const container = document.querySelector('#example1');
const output = document.querySelector('#example1-output');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  dataProvider: {
    // the row selection keeps rows by this id, so it survives page changes
    rowId: 'id',
    fetchRows: fetchOrders,
    onRowsCreate: async() => {},
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  },
  columns: [
    { data: 'id', title: 'Order', readOnly: true },
    { data: 'customer', title: 'Customer' },
    { data: 'status', title: 'Status' },
    { data: 'total', title: 'Total', type: 'numeric' },
  ],
  colHeaders: true,
  rowHeaders: true,
  // reach the header checkboxes with the arrow keys, toggle them with Space
  navigableHeaders: true,
  pagination: { pageSize: 10 },
  height: 'auto',
  // enable the `RowSelection` plugin
  rowSelection: {
    // cancelled orders can't be selected
    isRowSelectable: (rowData) => rowData.status !== 'Cancelled',
  },
  afterRowSelectionChange() {
    const rowSelection = hot.getPlugin('rowSelection');

    // send this object to your server, which applies it to the rows it did not send
    output.innerText = `${rowSelection.getSelectedCount()} selected: ` +
      JSON.stringify(rowSelection.getServerSelection());
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
