/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      [settings]="hotSettings">
    </hot-table>
  `,
})
export class AppComponent {

  readonly hotSettings: GridSettings = {
    sheetsBar: {
      sheets: [
        {
          name: 'Budget',
          data: [
            ['Marketing', 4200, 5100],
            ['Engineering', 18700, 19200],
            ['Operations', 3100, 2900],
          ],
          settings: {
            colHeaders: ['Category • A', 'Q1 2026 • B', 'Q2 2026 • C'],
          },
        },
        {
          name: 'Notes',
          data: [
            ['Reviewed by Ana García on 2026-03-14'],
            ['Pending sign-off from Finance'],
          ],
          settings: {
            colHeaders: ['Note • A'],
          },
        },
      ],
      activeSheet: 0,
    },
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    height: 240,
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
