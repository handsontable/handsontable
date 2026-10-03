import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
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

const fetchOrders = async ({ page, pageSize }) => ({
  rows: serverOrders.slice((page - 1) * pageSize, page * pageSize),
  totalRows: serverOrders.length,
});

// The React wrapper calls `updateSettings` after every HotTable render. With
// `dataProvider`, each call refetches the current page. Keep this object
// stable, and write the selection status through a DOM ref so a checkbox
// click does not re-render HotTable.
const dataProvider = {
  // the row selection keeps rows by this id, so it survives page changes
  rowId: 'id',
  fetchRows: fetchOrders,
  onRowsCreate: async () => {},
  onRowsUpdate: async () => {},
  onRowsRemove: async () => {},
};

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const outputRef = useRef(null);

  return (
    <>
      <HotTable
        ref={hotRef}
        licenseKey="non-commercial-and-evaluation"
        dataProvider={dataProvider}
        columns={[
          { data: 'id', title: 'Order', readOnly: true },
          { data: 'customer', title: 'Customer' },
          { data: 'status', title: 'Status' },
          { data: 'total', title: 'Total', type: 'numeric' },
        ]}
        colHeaders={true}
        rowHeaders={true}
        // reach the header checkboxes with the arrow keys, toggle them with Space
        navigableHeaders={true}
        pagination={{ pageSize: 10 }}
        height="auto"
        // enable the `RowSelection` plugin
        rowSelection={{
          // cancelled orders can't be selected
          isRowSelectable: (rowData) => rowData.status !== 'Cancelled',
        }}
        afterRowSelectionChange={() => {
          const rowSelection = hotRef.current?.hotInstance?.getPlugin('rowSelection');

          if (rowSelection && outputRef.current) {
            // send this object to your server, which applies it to the rows it did not send
            outputRef.current.textContent = `${rowSelection.getSelectedCount()} selected: ${JSON.stringify(rowSelection.getServerSelection())}`;
          }
        }}
        autoWrapRow={true}
        autoWrapCol={true}
      />
      <output className="console" ref={outputRef}>
        0 selected
      </output>
    </>
  );
};

export default ExampleComponent;
