/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example2',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel'],
  ];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['SKU', 'Product', 'Supplier', 'Category'],
    // no row numbers: the checkbox column is the only row header
    rowHeaders: false,
    // reach the header checkbox with the arrow keys, toggle it with Space
    navigableHeaders: true,
    rowSelection: true,
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
