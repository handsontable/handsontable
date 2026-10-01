/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const warehouses = [
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
];
const products = [
  'Stainless Steel Water Bottle',
  'Wireless Mouse',
  'Ergonomic Office Chair',
  'USB-C Charging Cable',
  'Aluminum Water Filter',
  'Canvas Tote Bag',
  'USB-C Hub',
  'Ceramic Mug Set',
  'Desk Lamp',
  'Laptop Stand',
  'Bluetooth Speaker',
  'Standing Desk',
];

@Component({
  selector: 'example1-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
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
        source: [
          'Harbor Goods',
          'Alpine Supply Co.',
          'Cascade Distributors',
          'Summit Trading',
          'Northgate Wholesale',
          'Nordic Traders',
        ],
        strict: false,
      },
      {},
      {
        type: 'autocomplete',
        source: warehouses,
        strict: false,
        visibleRows: 4,
      },
      {
        type: 'autocomplete',
        source: products,
        strict: false,
        trimDropdown: false,
        width: 120,
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
