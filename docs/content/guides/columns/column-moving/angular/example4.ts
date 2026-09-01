/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

const data = [
  ['SKU-4821', 'Wireless keyboard', 'Harbor Goods', 142],
  ['SKU-0093', 'USB-C dock', 'Vertex Supply', 67],
  ['SKU-3148', '27-inch monitor', 'Alpine Supply Co.', 24],
  ['SKU-7720', 'Laptop stand', 'Northstar Wholesale', 89],
  ['SKU-1056', 'Noise-canceling headset', 'Summit Distribution', 35],
];

@Component({
  selector: 'example4-column-moving',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <label>
          <input type="checkbox" (change)="onAllowColumnMovingChange($event)" />
          Allow column moving
        </label>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})

export class AppComponent {
  readonly data = data;
  allowColumnMoving = false;
  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Supplier', 'Stock'],
    rowHeaders: true,
    manualColumnMove: true,
    beforeColumnMove: () => this.allowColumnMoving,
    stretchH: 'all',
    height: 'auto',
  };

  onAllowColumnMovingChange(event: Event): void {
    this.allowColumnMoving = (event.target as HTMLInputElement).checked;
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
/* end-file */
