/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-dropdown-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Electronics', 'Austin'],
    ['SKU-3341', 'Aluminum Water Filter', 'Drinkware', 'Minneapolis'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['SKU', 'Product', 'Category', 'Warehouse'],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {},
      {},
      {
        type: 'dropdown',
        source: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
      },
      {
        type: 'dropdown',
        source: [
          'Seattle',
          'Denver',
          'Portland',
          'Austin',
          'Minneapolis',
          'Boston',
          'Chicago',
          'Phoenix',
          'Atlanta',
          'Dallas',
          'San Jose',
          'Columbus',
        ],
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
