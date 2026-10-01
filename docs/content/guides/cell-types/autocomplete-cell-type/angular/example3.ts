/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {

  readonly data = [
    ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
    ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
    ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
    ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
    ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['Supplier', 'SKU', 'Warehouse', 'Product'],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'autocomplete',
        source: (_query: string, process: (items: string[]) => void) => {
          fetch('https://handsontable.com/docs/scripts/json/autocomplete.json')
              .then((response) => response.json())
              .then((response) => process(response.data));
        },
        strict: true,
      },
      {}, // SKU is a default text column
      {}, // Warehouse is a default text column
      {}, // Product is a default text column
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
