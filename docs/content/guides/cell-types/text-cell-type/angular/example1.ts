/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-text-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    { sku: '004821', category: '032', quantity: 142, unitPrice: 18.5 },
    { sku: '000093', category: '032', quantity: 0, unitPrice: 42.0 },
    { sku: '017640', category: '015', quantity: 67, unitPrice: 9.99 },
    { sku: '002210', category: '015', quantity: 310, unitPrice: 4.25 },
    { sku: '008875', category: '048', quantity: 24, unitPrice: 129.0 },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Category code', 'Quantity', 'Unit price ($)'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'sku', type: 'text' },
      { data: 'category', type: 'text' },
      { data: 'quantity', type: 'numeric' },
      { data: 'unitPrice', type: 'numeric' },
    ]
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
