/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example2',
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
    ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
    ['Helium', 'He', 2, 4.003, 9, -458.0, -452.1],
    ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
    ['Beryllium', 'Be', 4, 9.012, 11, 2348.6, 4478.8],
    ['Boron', 'B', 5, 10.81, 11, 3768.8, 7100.6],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: [
      'Name',
      'Symbol',
      'Atomic Number',
      'Atomic Mass (u)',
      'Known Isotopes',
      'Melting Point (°F)',
      'Boiling Point (°F)',
    ],
    columns: [
      {},
      {},
      { type: 'numeric', numericFormat: { maximumFractionDigits: 0, useGrouping: false } },
      { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
      { type: 'numeric', numericFormat: { maximumFractionDigits: 0, useGrouping: false } },
      { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
      { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
    ],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
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
