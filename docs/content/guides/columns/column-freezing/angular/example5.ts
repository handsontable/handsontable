/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example5',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly colHeaders = ['SKU', 'Product', 'Category', 'Supplier', 'Warehouse', 'In stock', 'Unit price', 'Rating', 'Last restock', 'Status'];

  readonly hotData = [
    ['KB-1042', 'Mechanical Keyboard', 'Electronics', 'Alpine Supply Co.', 'Seattle', 142, 89.99, 4.6, '2025-03-14', 'Active'],
    ['WB-0093', 'Stainless Steel Water Bottle', 'Drinkware', 'Harbor Goods', 'Denver', 67, 24.5, 4.8, '2025-04-02', 'Active'],
    ['MS-2210', 'Wireless Mouse', 'Electronics', 'Alpine Supply Co.', 'Austin', 0, 34.99, 4.3, '2025-01-27', 'Discontinued'],
    ['BP-4821', 'Waterproof Backpack', 'Apparel', 'Northwind Traders', 'Portland', 38, 79, 4.5, '2025-05-19', 'Active'],
    ['DL-3307', 'LED Desk Lamp', 'Home Office', 'Harbor Goods', 'Denver', 215, 42.75, 4.1, '2025-02-08', 'Active'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: this.colHeaders,
    colWidths: 110,
    width: '100%',
    height: 'auto',
    rowHeaders: true,
    contextMenu: true,
    manualColumnMove: true,
    manualColumnFreeze: {
      restoreColumnPosition: true,
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
