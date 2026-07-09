/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-merge-cells',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <output class="console" id="example3-output">{{
      output ||
        'Select cells, then press Ctrl+M (or use the context menu) to merge or unmerge them. Hook activity appears here.'
    }}</output>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  output = '';

  readonly data = [
    ['North America', 420000, 465000, 501000],
    ['Europe', 388000, 402000, 411000],
    ['APAC', 275000, 298000, 312000],
    ['Latin America', 142000, 151000, 158000],
    ['Middle East', 96000, 101000, 108000],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
    rowHeaders: true,
    height: 'auto',
    contextMenu: true,
    mergeCells: true,
    autoWrapRow: true,
    autoWrapCol: true,
    beforeMergeCells: (cellRange) => {
      this.logEvent(`beforeMergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
    },
    afterMergeCells: (cellRange, mergeParent) => {
      this.logEvent(`afterMergeCells: merged into ${mergeParent.rowspan} row(s) by ${mergeParent.colspan} column(s).`);
    },
    beforeUnmergeCells: (cellRange) => {
      this.logEvent(`beforeUnmergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
    },
    afterUnmergeCells: (cellRange) => {
      this.logEvent(`afterUnmergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
    },
  };

  private logEvent(message: string): void {
    this.output = `${message}\n${this.output}`;
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
