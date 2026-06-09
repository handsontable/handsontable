/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
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
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    // add an empty row
    [null]
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['sum', 'min', 'max', 'count', 'average'],
    rowHeaders: true,
    // enable and configure the `ColumnSummary` plugin
    columnSummary: [
      {
        sourceColumn: 0,
        type: 'sum',
        destinationRow: 3,
        destinationColumn: 0,
        // force this column summary to treat non-numeric values as numeric values
        forceNumeric: true,
      },
      {
        sourceColumn: 1,
        type: 'min',
        destinationRow: 3,
        destinationColumn: 1,
      },
      {
        sourceColumn: 2,
        type: 'max',
        destinationRow: 3,
        destinationColumn: 2,
      },
      {
        sourceColumn: 3,
        type: 'count',
        destinationRow: 3,
        destinationColumn: 3,
      },
      {
        sourceColumn: 4,
        type: 'average',
        destinationRow: 3,
        destinationColumn: 4,
      },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
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
