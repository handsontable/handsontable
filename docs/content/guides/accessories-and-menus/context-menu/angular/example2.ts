/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example2',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      [settings]="hotSettings" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {

  readonly hotData = [
    ['Hydrogen', 'H', 1, 1.008, 7],
    ['Helium', 'He', 2, 4.003, 9],
    ['Lithium', 'Li', 3, 6.94, 9],
    ['Beryllium', 'Be', 4, 9.012, 11],
    ['Boron', 'B', 5, 10.81, 15],
  ];

  readonly hotSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass', 'Known isotopes'],
    contextMenu: ['row_above', 'row_below', 'remove_row', 'clear_column'],
    height: 'auto',
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
