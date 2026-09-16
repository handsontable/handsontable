/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly columnHeaders = ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes', 'Melting Point (°F)', 'Boiling Point (°F)'];

  readonly hotData = [
    ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
    ['Helium', 'He', 2, 4.003, 9, -458.3, -452.1],
    ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
    ['Beryllium', 'Be', 4, 9.012, 11, 2348.6, 4478.8],
    ['Boron', 'B', 5, 10.81, 11, 3768.8, 7100.6],
  ];

  readonly hotSettings: GridSettings = {
    // Number each header with its column position, something a plain array can't do.
    colHeaders: (index: number) => {
      return `${index + 1}. ${this.columnHeaders[index]}`;
    },
    columns: [
      {},
      {},
      { type: 'numeric', numericFormat: { pattern: '0' } },
      { type: 'numeric', numericFormat: { pattern: '0.0' } },
      { type: 'numeric', numericFormat: { pattern: '0' } },
      { type: 'numeric', numericFormat: { pattern: '0.0' } },
      { type: 'numeric', numericFormat: { pattern: '0.0' } },
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
