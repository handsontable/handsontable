/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-merge-cells',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button id="example4-merge" class="button button--primary" (click)="mergeNoteRow()">
          Merge the note row
        </button>
        <button id="example4-unmerge" class="button button--primary" (click)="unmergeNoteRow()">
          Unmerge the note row
        </button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['North America', 420000, 465000, 501000],
    ['Europe', 388000, 402000, 411000],
    ['APAC', 275000, 298000, 312000],
    ['Latin America', 142000, 151000, 158000],
    ['Middle East', 96000, 101000, 108000],
    ['Note: Q1 totals include a one-time currency adjustment.', null, null, null],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
    rowHeaders: true,
    height: 'auto',
    contextMenu: true,
    mergeCells: true,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  mergeNoteRow(): void {
    this.hotTable?.hotInstance?.getPlugin('mergeCells').merge(5, 0, 5, 3);
  }

  unmergeNoteRow(): void {
    this.hotTable?.hotInstance?.getPlugin('mergeCells').unmerge(5, 0, 5, 3);
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
