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

  // show the same note in three columns, to compare how each one is truncated
  readonly hotData = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Ships in recyclable packaging. Harbor Goods needs ten days to restock this item, so order early.'],
    ['SKU-0093', 'Wireless Mouse', 'Available in black and silver. The silver version is on backorder until the end of the month.'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Assembly required. Cascade Distributors includes a hex key and a printed guide in the box.'],
    ['SKU-2208', 'USB-C Charging Cable', 'In stock.'],
  ].map(([sku, product, note]) => [sku, product, note, note, note]);

  readonly hotSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Note', 'Note (one line)', 'Note (two lines)'],
    colWidths: [100, 190, 170, 170, 170],
    columns: [
      {},
      {},
      // no truncation (default): the row grows to fit the whole note
      {},
      // keep the note on one line and end it with an ellipsis
      { textEllipsis: true },
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
