/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = [
    { sku: 'SKU-4821', product: 'Stainless Steel Water Bottle', supplier: 'Harbor Goods', category: 'Drinkware' },
    { sku: 'SKU-0093', product: 'Wireless Mouse', supplier: 'Alpine Supply Co.', category: 'Electronics' },
    { sku: 'SKU-1170', product: 'Ergonomic Office Chair', supplier: 'Cascade Distributors', category: 'Furniture' },
    { sku: 'SKU-2208', product: 'USB-C Charging Cable', supplier: 'Summit Trading', category: 'Electronics' },
    { sku: 'SKU-3341', product: 'Aluminum Water Filter', supplier: 'Northgate Wholesale', category: 'Drinkware' },
    { sku: 'SKU-4412', product: 'Canvas Tote Bag', supplier: 'Nordic Traders', category: 'Apparel' },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      // an empty column that holds only the checkboxes, with no label and no editor
      { data: 'rowSelection', editor: false, width: 44, className: 'htCenter' },
      { data: 'sku' },
      { data: 'product' },
      { data: 'supplier' },
      { data: 'category' },
    ],
    colHeaders: ['', 'SKU', 'Product', 'Supplier', 'Category'],
    height: 'auto',
    rowHeaders: false,
    // reach the header checkbox with the arrow keys, toggle it with Space
    navigableHeaders: true,
    // render the checkboxes inside the first column
    rowSelection: {
      checkboxLocation: 'firstColumn',
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
