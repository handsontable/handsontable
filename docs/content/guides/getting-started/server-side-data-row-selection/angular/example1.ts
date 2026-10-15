/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type { DataProviderQueryParameters } from 'handsontable/plugins/dataProvider';

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

@Component({
  selector: 'app-example1',
  template: `
    <hot-table [settings]="hotSettings!"></hot-table>
    <output class="console">{{ output }}</output>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  output = '0 selected';

  readonly hotSettings: GridSettings = {
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
    afterRowSelectionChange: () => {
      const rowSelection = this.hotTable.hotInstance!.getPlugin('rowSelection');

      // send this object to your server, which applies it to the rows it did not send
      this.output = `${rowSelection.getSelectedCount()} selected: ${JSON.stringify(rowSelection.getServerSelection())}`;
    },
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
