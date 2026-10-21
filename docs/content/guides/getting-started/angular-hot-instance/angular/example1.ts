/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-instance-access',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <button (click)="selectCell()">Select cell B2</button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: true }) readonly hotTable!: HotTableComponent;

  readonly data: string[][] = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', '215'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  selectCell(): void {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    this.hotTable?.hotInstance?.selectCell(1, 1);
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
