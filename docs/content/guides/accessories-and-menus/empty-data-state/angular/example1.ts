/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      [settings]="hotSettings"
      [data]="hotData"
    >
    </hot-table>
  `,
})
export class AppComponent {

  readonly hotData = [];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    colHeaders: true,
    rowHeaders: true,
    navigableHeaders: true,
    dropdownMenu: true,
    filters: true,
    emptyDataState: true, // Enable empty data state with default settings
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
