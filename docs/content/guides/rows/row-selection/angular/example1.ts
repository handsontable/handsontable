/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
    <output class="console">{{ output }}</output>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  output = 'Selected products: none';

  readonly hotData = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Active'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Active'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Discontinued'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Active'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Active'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel', 'Discontinued'],
    ['SKU-5088', 'USB-C Hub', 'Harbor Goods', 'Electronics', 'Active'],
    ['SKU-6120', 'Ceramic Mug Set', 'Alpine Supply Co.', 'Drinkware', 'Active'],
    ['SKU-7294', 'Desk Lamp', 'Cascade Distributors', 'Furniture', 'Active'],
    ['SKU-8015', 'Laptop Stand', 'Summit Trading', 'Furniture', 'Active'],
  ];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['SKU', 'Product', 'Supplier', 'Category', 'Status'],
    rowHeaders: true,
    // reach the header checkboxes with the arrow keys, toggle them with Space
    navigableHeaders: true,
    filters: true,
    dropdownMenu: true,
    // enable the `RowSelection` plugin
    rowSelection: {
      // "select all" acts on the rows that pass the filters
      selectAll: 'filtered',
      // discontinued products can't be selected
      isRowSelectable: (rowData: unknown) => (rowData as string[])[4] !== 'Discontinued',
    },
    autoWrapRow: true,
    autoWrapCol: true,
    afterRowSelectionChange: () => {
      const selected = this.hotTable.hotInstance!.getPlugin('rowSelection').getSelectedRowsData() as string[][];

      this.output = `Selected products: ${selected.map((row) => row[0]).join(', ') || 'none'}`;
    },
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
