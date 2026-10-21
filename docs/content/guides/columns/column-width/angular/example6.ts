/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example6',
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
    ['H', 'Hydrogen', 1, 'Gas'],
    ['He', 'Helium', 2, 'Gas'],
    ['Li', 'Lithium', 3, 'Solid'],
    ['Be', 'Beryllium', 4, 'Solid'],
    ['B', 'Boron', 5, 'Solid'],
  ];

  readonly hotSettings: GridSettings = {
    width: '100%',
    height: 'auto',
    colWidths: 80,
    colHeaders: ['Symbol', 'Name', 'Atomic Number', 'State'],
    rowHeaders: true,
    stretchH: 'last',
    contextMenu: true,
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
