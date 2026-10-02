/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example5',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly hotData = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Ships in recyclable packaging. Harbor Goods needs ten days to restock this item, so order early.'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Available in black and silver. The silver version is on backorder until the end of the month.'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Assembly required. Cascade Distributors includes a hex key and a printed guide in the box.'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'In stock.'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Supplier', 'Note'],
    colWidths: [100, 190, 170, 220],
    columns: [
      {},
      {},
      {},
      // show two lines of the note and end the second one with an ellipsis
      { textEllipsis: 2 },
    ],
    width: '100%',
    height: 'auto',
    rowHeaders: true,
    autoRowSize: true,
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
