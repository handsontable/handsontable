/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

interface CatalogRow {
  name: string;
  sku: string | null;
  stock: number | null;
  __children?: CatalogRow[];
}

@Component({
  selector: 'app-example5',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly hotData: CatalogRow[] = [
    {
      name: 'Electronics',
      sku: null,
      stock: null,
      __children: [
        {
          name: 'Audio',
          sku: null,
          stock: null,
          __children: [
            { name: 'Wireless Headphones', sku: 'SKU-2001', stock: 34 },
            { name: 'Bluetooth Speaker', sku: 'SKU-2002', stock: 12 },
          ],
        },
        {
          name: 'Computer Accessories',
          sku: null,
          stock: null,
          __children: [
            { name: 'Wireless Mouse', sku: 'SKU-0093', stock: 120 },
            { name: 'USB-C Charging Cable', sku: 'SKU-2208', stock: 310 },
            { name: 'Laptop Stand', sku: 'SKU-3105', stock: 0 },
          ],
        },
      ],
    },
    {
      name: 'Home & Office',
      sku: null,
      stock: null,
      __children: [
        {
          name: 'Furniture',
          sku: null,
          stock: null,
          __children: [
            { name: 'Ergonomic Office Chair', sku: 'SKU-1170', stock: 8 },
            { name: 'Standing Desk', sku: 'SKU-1185', stock: 5 },
          ],
        },
        {
          name: 'Lighting',
          sku: null,
          stock: null,
          __children: [
            { name: 'Desk Lamp', sku: 'SKU-1402', stock: 46 },
          ],
        },
      ],
    },
    {
      name: 'Drinkware',
      sku: null,
      stock: null,
      __children: [
        { name: 'Stainless Steel Water Bottle', sku: 'SKU-4821', stock: 75 },
        { name: 'Aluminum Water Filter', sku: 'SKU-3341', stock: 22 },
      ],
    },
  ];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    width: '100%',
    stretchH: 'all',
    colHeaders: ['Name', 'SKU', 'Stock'],
    columns: [
      { data: 'name' },
      { data: 'sku' },
      { data: 'stock', type: 'numeric' },
    ],
    // the collapse buttons live in the row headers
    rowHeaders: true,
    nestedRows: true,
    // the default `groupSelects: 'descendants'`: a parent row selects every row under it,
    // and shows a mixed state while only some of them are selected
    rowSelection: true,
    navigableHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  ngAfterViewInit() {
    // preselect the Wireless Mouse and the Desk Lamp to show the mixed parents
    this.hotTable.hotInstance!.getPlugin('rowSelection').selectRows([5, 13]);
  }
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
