/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example7',
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
    ['SKU-4821', 'Bolt', 142],
    ['SKU-0093', 'Stainless steel mounting bracket', 67],
    ['SKU-1147', 'Washer', 210],
    ['SKU-2205', 'Hex nut assortment pack', 38],
    ['SKU-3310', 'Cable tie', 95],
  ];

  readonly hotSettings: GridSettings = {
    width: '100%',
    height: 'auto',
    colHeaders: ['SKU', 'Product', 'Stock'],
    rowHeaders: true,
    colWidths: [90, undefined, 60],
    modifyColWidth(width: number, column: number) {
      if (column === 1 && width > 150) {
        return 100;
      }

      return width;
    },
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
