/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import ExcelJS from 'exceljs';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example2',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportSheets()">Export XLSX</button>
      </div>
    </div>

    <p><strong>Q1 Sales</strong></p>
    <hot-table [settings]="sharedSettings" [data]="q1Data"></hot-table>

    <p><strong>Q2 Sales</strong></p>
    <hot-table #hotQ2 [settings]="sharedSettings" [data]="q2Data"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild('hotQ2', { static: false }) hotQ2!: HotTableComponent;
  @ViewChild(HotTableComponent, { static: false }) hotQ1!: HotTableComponent;

  readonly q1Data = [
    ['Alice Martin',  'North', 142000, true ],
    ['Bob Chen',      'East',   98500, true ],
    ['Carol Davies',  'South',  76200, false],
    ['David Kim',     'West',  115300, true ],
    ['Eva Rossi',     'North',  54800, false],
  ];

  readonly q2Data = [
    ['Alice Martin',  'North', 158000, true ],
    ['Bob Chen',      'East',  112400, true ],
    ['Carol Davies',  'South',  89100, true ],
    ['David Kim',     'West',   97600, false],
    ['Eva Rossi',     'North',  63200, true ],
  ];

  readonly sharedSettings: GridSettings = {
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
    exportFile: { engines: { xlsx: ExcelJS } },
  };

  async exportSheets(): Promise<void> {
    const hotQ1 = this.hotQ1.hotInstance!;
    const exportPlugin = hotQ1.getPlugin('exportFile');

    await exportPlugin.downloadFileAsync('xlsx', {
      filename: 'Annual-Sales-Report',
      sheets: [
        { instance: hotQ1, name: 'Q1 Sales', colHeaders: true, rowHeaders: true },
        { instance: this.hotQ2.hotInstance!, name: 'Q2 Sales', colHeaders: true, rowHeaders: true },
      ],
    });
  }
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
