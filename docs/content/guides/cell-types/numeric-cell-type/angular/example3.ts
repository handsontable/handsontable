/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-numeric-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    {
      productName: 'Product A',
      JP_price: 1450.32,
      TR_price: 202.14,
    },
    {
      productName: 'Product B',
      JP_price: 2430.22,
      TR_price: 338.86,
    },
    {
      productName: 'Product C',
      JP_price: 3120.1,
      TR_price: 435.2,
    },
  ];

  readonly gridSettings: GridSettings = {
    autoRowSize: false,
    autoColumnSize: false,
    columnSorting: true,
    colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'productName', type: 'text', width: '150' },
      {
        data: 'JP_price',
        type: 'numeric',
        locale: 'ja-JP',
        numericFormat: { style: 'decimal', useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 },
        width: '150',
      },
      {
        data: 'TR_price',
        type: 'numeric',
        locale: 'tr-TR',
        numericFormat: { style: 'decimal', useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 },
        width: '150',
      },
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
