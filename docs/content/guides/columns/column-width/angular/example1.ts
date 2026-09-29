/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
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
    ['H', 'Hydrogen', 1, 1.008, -434.4, 0.00009, 'Gas'],
    ['He', 'Helium', 2, 4.003, -458.0, 0.00018, 'Gas'],
    ['Li', 'Lithium', 3, 6.94, 356.9, 0.534, 'Solid'],
    ['Be', 'Beryllium', 4, 9.012, 2348.6, 1.85, 'Solid'],
    ['B', 'Boron', 5, 10.81, 3768.8, 2.34, 'Solid'],
  ];

  readonly hotSettings: GridSettings = {
    width: '100%',
    height: 'auto',
    colHeaders: ['Symbol', 'Name', 'Atomic Number', 'Atomic Mass', 'Melting Point (°F)', 'Density (g/cm³)', 'State'],
    rowHeaders: true,
    colWidths: 100,
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
