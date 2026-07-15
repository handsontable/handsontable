/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const skuValidator = (value: unknown, callback: (isValid: boolean) => void) => {
  callback(/^\d{6}$/.test(String(value)));
};

@Component({
  selector: 'example2-text-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    { sku: '004821', supplier: 'Harbor Goods', quantity: 142 },
    { sku: '000093', supplier: 'Alpine Supply Co.', quantity: 0 },
    { sku: '017640', supplier: 'Harbor Goods', quantity: 67 },
    { sku: '002210', supplier: 'Crestline Wholesale', quantity: 310 },
    { sku: '008875', supplier: 'Alpine Supply Co.', quantity: 24 },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Supplier', 'Quantity'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'sku', type: 'text', validator: skuValidator, allowInvalid: false },
      { data: 'supplier', type: 'text' },
      { data: 'quantity', type: 'numeric' },
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
