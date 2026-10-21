/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
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
    ['Hydrogen', 'H', 1],
    ['Helium', 'He', 2],
    ['Lithium', 'Li', 3],
    ['Beryllium', 'Be', 4],
    ['Boron', 'B', 5],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['Name', 'Symbol', 'Atomic Number'],
    rowHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
    stretchH: 'all',
    headerClassName: 'htCenter',
    columns: [{ headerClassName: 'htRight' }, { headerClassName: 'htLeft' }, { type: 'numeric' }]
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
