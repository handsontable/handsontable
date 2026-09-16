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

  readonly hotData = [
    ['H', 1, -434.4, 0.00009, 'Nonmetal'],
    ['He', 2, -458.0, 0.00018, 'Noble gas'],
    ['Li', 3, 356.9, 0.534, 'Alkali metal'],
    ['Be', 4, 2348.6, 1.85, 'Alkaline earth'],
    ['B', 5, 3768.8, 2.34, 'Metalloid'],
  ];

  readonly hotSettings: GridSettings = {
    width: '100%',
    height: 'auto',
    colHeaders: ['Symbol', 'Atomic Number', 'Melting Point (°F)', 'Density (g/cm³)', 'Group'],
    rowHeaders: true,
    colWidths(index: number) {
      return (index + 1) * 40;
    },
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
