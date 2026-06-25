/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-custom-id',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table
      id="inventory-grid"
      class="inventory-grid"
      style="display: block; border: 1px solid #4caf50;"
      [data]="data"
      [settings]="gridSettings"
    ></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data = [
    ['SKU-4821', 'Wireless Mouse', 142, 'Electronics'],
    ['SKU-0093', 'USB-C Cable', 67, 'Electronics'],
    ['SKU-1175', 'Desk Lamp', 0, 'Home Office'],
    ['SKU-3340', 'Notebook', 230, 'Stationery'],
    ['SKU-7782', 'Standing Desk', 18, 'Furniture'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Stock', 'Category'],
    height: 'auto',
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
