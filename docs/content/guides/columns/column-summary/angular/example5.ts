/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example5',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent implements OnInit {

  hotData: number[][] = [];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    colHeaders: true,
    rowHeaders: true,
    // enable the `ColumnSummary` plugin
    columnSummary: [
      // configure a column summary
      {
        // set the `type` option to `'custom'`
        type: 'custom',
        destinationRow: 0,
        destinationColumn: 5,
        reversedRowCoords: true,
        // add your custom summary function
        customFunction(endpoint) {
          // implement a function that counts the number of even values in the column
          const hotInstance = this.hot;
          let evenCount = 0;
          // a helper function
          const checkRange = (rowRange: any) => {
            let i = rowRange[1] || rowRange[0];
            let counter = 0;

            do {
              if (
                parseInt(
                  hotInstance.getDataAtCell(i, endpoint.sourceColumn),
                  10
                ) %
                2 ===
                0
              ) {
                counter++;
              }

              i--;
            } while (i >= rowRange[0]);

            return counter;
          };

          // go through all declared ranges
          for (const r in endpoint.ranges) {
            if (endpoint.ranges.hasOwnProperty(r)) {
              evenCount += checkRange(endpoint.ranges[r]);
            }
          }

          return evenCount;
        },
        forceNumeric: true,
      },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
  };

  ngOnInit() {
    // initialize a Handsontable instance with the generated numeric data
    this.hotData = this.generateData(5, 7);
  }

  // generate an array of arrays with dummy numeric data
  private generateData = (rows = 3, columns = 7, additionalRows = true) => {
    let counter = 0;
    const array2d = [...new Array(rows)].map((_) =>
      [...new Array(columns)].map((_) => counter++)
    );

    if (additionalRows) {
      array2d.push([]);
      array2d.push([]);
    }

    return array2d;
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
