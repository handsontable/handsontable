/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-merge-cells',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = new Array(50) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(500) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  readonly gridSettings: GridSettings = {
    height: 320,
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    mergeCells: {
      virtualized: true,
      cells: [{ row: 1, col: 1, rowspan: 3, colspan: 498 }],
    },
    viewportColumnRenderingOffset: 15,
    viewportColumnRenderingThreshold: 5,
    autoWrapRow: true,
    autoWrapCol: true
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
