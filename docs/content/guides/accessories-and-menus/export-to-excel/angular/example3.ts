/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import ExcelJS from 'exceljs';

@Component({
  selector: 'app-example3',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <p>Right-click any cell to open the context menu.</p>
    </div>
    <hot-table [settings]="hotSettings" [data]="hotData"></hot-table>
  `,
})
export class AppComponent {
  readonly hotData = [
    ['Alice Martin',  'North', 142000, true ],
    ['Bob Chen',      'East',   98500, true ],
    ['Carol Davies',  'South',  76200, false],
    ['David Kim',     'West',  115300, true ],
    ['Eva Rossi',     'North',  54800, false],
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      { type: 'text' },
      { type: 'dropdown', source: ['North', 'South', 'East', 'West'] },
      {
        type: 'numeric',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
      },
      { type: 'checkbox' },
    ],
    colHeaders: ['Name', 'Region', 'Revenue ($)', 'Hit Target?'],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    contextMenu: true,
    exportFile: { engines: { xlsx: ExcelJS } },
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
