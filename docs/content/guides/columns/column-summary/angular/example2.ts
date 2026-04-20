/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example2',
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
    [null],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    columnSummary: [
      {
        sourceColumn: 0,
        type: 'sum',
        // for this column summary, count row coordinates backward
        reversedRowCoords: true,
        // now, to always display this column summary in the bottom row,
        // set `destinationRow` to `0` (i.e. the last possible row)
        destinationRow: 0,
        destinationColumn: 0,
      },
      {
        sourceColumn: 1,
        type: 'min',
        // for this column summary, count row coordinates backward
        reversedRowCoords: true,
        // now, to always display this column summary in the bottom row,
        // set `destinationRow` to `0` (i.e. the last possible row)
        destinationRow: 0,
        destinationColumn: 1,
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
