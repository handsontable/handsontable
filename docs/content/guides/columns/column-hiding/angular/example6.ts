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

  readonly hotData = new Array(10) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(10) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  readonly hotSettings: GridSettings = {
    height: 200,
    colHeaders: true,
    rowHeaders: true,
    contextMenu: ['hidden_columns_show', 'hidden_columns_hide'],
    hiddenColumns: {
      columns: [3, 5, 9],
      indicators: true,
      // exclude hidden columns from copying and pasting
      copyPasteEnabled: false,
    },
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
