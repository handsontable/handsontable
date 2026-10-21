/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  readonly hotData = [
    { order: 1001, customer: 'Harbor Goods', total: 420, selected: false },
    { order: 1002, customer: 'Alpine Supply Co.', total: 185, selected: true },
    { order: 1003, customer: 'Cascade Distributors', total: 960, selected: false },
    { order: 1004, customer: 'Summit Trading', total: 75, selected: false },
    { order: 1005, customer: 'Nordic Traders', total: 310, selected: true },
    { order: 1006, customer: 'Northgate Wholesale', total: 540, selected: false },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      { data: 'selected', title: 'Selected', type: 'checkbox' },
      { data: 'order', title: 'Order', readOnly: true },
      { data: 'customer', title: 'Customer' },
      { data: 'total', title: 'Total', type: 'numeric' },
    ],
    colHeaders: true,
    rowHeaders: true,
    // reach the header checkboxes with the arrow keys, toggle them with Space
    navigableHeaders: true,
    height: 'auto',
    // the values of the `selected` column are the row selection
    rowSelection: {
      checkboxLocation: { column: 'selected' },
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
