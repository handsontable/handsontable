/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-selection',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <label>
          <input type="checkbox" checked (change)="toggleAutoWrapRow($event)">
          Wrap at the left/right edges (autoWrapRow)
        </label>
        <label>
          <input type="checkbox" checked (change)="toggleAutoWrapCol($event)">
          Wrap at the top/bottom edges (autoWrapCol)
        </label>
      </div>
      <p>
        Select a cell, then press <kbd>Tab</kbd> or <kbd>&rarr;</kbd> at the end of a row, or <kbd>Enter</kbd> or
        <kbd>&darr;</kbd> at the bottom of a column, to see the effect.
      </p>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['SKU-4821', 'Harbor Goods', 'Electronics', 142],
    ['SKU-0093', 'Alpine Supply Co.', 'Apparel', 67],
    ['SKU-2210', 'Harbor Goods', 'Electronics', 0],
    ['SKU-7734', 'Nordic Traders', 'Home Goods', 58],
    ['SKU-1145', 'Alpine Supply Co.', 'Apparel', 213],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Supplier', 'Category', 'Quantity'],
    width: 'auto',
    height: 'auto',
    rowHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  toggleAutoWrapRow(event: Event): void {
    this.hotTable?.hotInstance?.updateSettings({ autoWrapRow: (event.target as HTMLInputElement).checked });
  }

  toggleAutoWrapCol(event: Event): void {
    this.hotTable?.hotInstance?.updateSettings({ autoWrapCol: (event.target as HTMLInputElement).checked });
  }
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
