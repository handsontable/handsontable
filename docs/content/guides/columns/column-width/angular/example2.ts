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
    ['H', 1, 'Hydrogen', 'Nonmetal', 1.008, -434.4, -423.2, 0.00009, 2.2, 25],
    ['He', 2, 'Helium', 'Noble gas', 4.003, -458.0, -452.1, 0.00018, undefined, undefined],
    ['Li', 3, 'Lithium', 'Alkali metal', 6.94, 356.9, 2447.6, 0.534, 0.98, 145],
    ['Be', 4, 'Beryllium', 'Alkaline earth metal', 9.012, 2348.6, 4478.8, 1.85, 1.57, 105],
    ['B', 5, 'Boron', 'Metalloid', 10.81, 3768.8, 7100.6, 2.34, 2.04, 85],
  ];

  readonly hotSettings: GridSettings = {
    width: '100%',
    height: 'auto',
    colHeaders: [
      'Symbol',
      'Atomic Number',
      'Name',
      'Category',
      'Atomic Mass',
      'Melting Point (°F)',
      'Boiling Point (°F)',
      'Density (g/cm³)',
      'Electronegativity',
      'Atomic Radius (pm)',
    ],
    rowHeaders: true,
    colWidths: [70, 120, 90, 160, 110, 140, 140, 130, 140, 150],
    manualColumnResize: true,
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
