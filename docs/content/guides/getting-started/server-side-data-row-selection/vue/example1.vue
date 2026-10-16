<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

registerAllModules();

type Order = { id: number; customer: string; status: string; total: number };

const STATUSES = ['Pending', 'Paid', 'Shipped', 'Cancelled'];
const CUSTOMERS = ['Harbor Goods', 'Alpine Supply Co.', 'Cascade Distributors', 'Summit Trading', 'Nordic Traders'];

// An in-memory "server" with 40 orders. Replace it with requests to your API.
const serverOrders: Order[] = Array.from({ length: 40 }, (_, index) => ({
  id: 1001 + index,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  status: STATUSES[index % STATUSES.length],
  total: 25 + ((index * 37) % 400),
}));

const fetchOrders = async({ page, pageSize }: DataProviderQueryParameters) => ({
  rows: serverOrders.slice((page - 1) * pageSize, page * pageSize),
  totalRows: serverOrders.length,
});

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const output = ref('0 selected');

const hotSettings = ref<GridSettings>({
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
    isRowSelectable: (rowData: unknown) => (rowData as Order).status !== 'Cancelled',
  },
  afterRowSelectionChange() {
    const rowSelection = hotRef.value?.hotInstance?.getPlugin('rowSelection');

    if (rowSelection) {
      // send this object to your server, which applies it to the rows it did not send
      output.value = `${rowSelection.getSelectedCount()} selected: ${JSON.stringify(rowSelection.getServerSelection())}`;
    }
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example1">
    <HotTable ref="hotRef" :settings="hotSettings" />
    <output class="console">{{ output }}</output>
  </div>
</template>
