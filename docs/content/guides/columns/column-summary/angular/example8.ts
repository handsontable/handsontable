/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example8',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly hotData = [[0, 1, 2], ['3c', '4b', 5], [], []];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    columnSummary: [
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 0,
        reversedRowCoords: true,
        // enable throwing data type errors for this column summary
        suppressDataTypeErrors: false,
      },
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 1,
        reversedRowCoords: true,
        // enable throwing data type errors for this column summary
        suppressDataTypeErrors: false,
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
