/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type Handsontable from 'handsontable/base';

@Component({
  selector: 'example1-custom-shortcuts',
  standalone: true,
  imports: [HotTableModule],
  template: `<div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data: Array<Array<string | number>> = [
    ['SKU-4821', 'Wireless Mouse', 128, 'Electronics'],
    ['SKU-0093', 'Desk Lamp', 42, 'Home Goods'],
    ['SKU-7734', 'USB-C Cable', 310, 'Electronics'],
    ['SKU-2210', 'Notebook Set', 87, 'Office Supplies'],
    ['SKU-5567', 'Water Bottle', 156, 'Outdoor'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Quantity', 'Category'],
    columns: [{}, {}, { type: 'numeric' }, {}],
    height: 'auto',
    afterInit(this: Handsontable) {
      // get the `grid` context from the `ShortcutManager` API
      const gridContext = this.getShortcutManager().getContext('grid');

      if (!gridContext) {
        return;
      }

      // register a custom keyboard shortcut in the `grid` context:
      // pressing Control/Meta+Enter inserts a new row below the selected cell
      gridContext.addShortcut({
        keys: [['control/meta', 'enter']],
        group: 'insertRowBelow',
        callback: () => {
          const selected = this.getSelectedRangeLast();

          if (!selected || selected.highlight.row === null) {
            return;
          }

          this.alter('insert_row_below', selected.highlight.row);
        },
      });
    },
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
