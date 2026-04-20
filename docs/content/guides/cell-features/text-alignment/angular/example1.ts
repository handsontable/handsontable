/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-text-alignment',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  // generate an array of arrays with dummy data
  readonly data = new Array(100) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(18) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  readonly gridSettings: GridSettings = {
    height: 320,
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    mergeCells: [
      { row: 1, col: 1, rowspan: 3, colspan: 3 },
      { row: 3, col: 4, rowspan: 2, colspan: 2 },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    className: 'htCenter',
    cell: [
      { row: 0, col: 0, className: 'htRight' },
      { row: 1, col: 1, className: 'htLeft htMiddle' },
      { row: 3, col: 4, className: 'htLeft htBottom' },
    ],
    afterSetCellMeta: (row, col, key, val) => {
      console.log('cell meta changed', row, col, key, val);
    }
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
