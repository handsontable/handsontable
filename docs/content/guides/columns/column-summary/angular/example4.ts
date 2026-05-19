/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
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
    {
      value: null,
      __children: [{ value: 5 }, { value: 6 }, { value: 7 }],
    },
    {
      __children: [{ value: 15 }, { value: 16 }, { value: 17 }],
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [{ data: 'value' }],
    nestedRows: true,
    rowHeaders: true,
    colHeaders: ['sum', 'min', 'max', 'count', 'average'],
    // @ts-ignore
    columnSummary() {
      const endpoints = [];
      const nestedRowsPlugin = this.hot.getPlugin('nestedRows');
      // @ts-ignore
      const getRowIndex = nestedRowsPlugin.dataManager.getRowIndex.bind(
        // @ts-ignore
        nestedRowsPlugin.dataManager
      );

      const resultColumn = 0;
      let nestedRowsCache = null;

      if (nestedRowsPlugin.isEnabled()) {
        // @ts-ignore
        nestedRowsCache = nestedRowsPlugin.dataManager.cache;
      } else {
        return [];
      }

      if (!nestedRowsCache) {
        return [];
      }

      for (let i = 0; i < nestedRowsCache.levels[0].length; i++) {
        if (
          !nestedRowsCache.levels[0][i].__children ||
          nestedRowsCache.levels[0][i].__children.length === 0
        ) {
          continue;
        }

        const tempEndpoint = {
          destinationColumn: resultColumn,
          destinationRow: getRowIndex(nestedRowsCache.levels[0][i]),
          type: 'sum',
          forceNumeric: true,
          ranges: [],
        };

        // @ts-ignore
        tempEndpoint.ranges.push([
          getRowIndex(nestedRowsCache.levels[0][i].__children[0]),
          getRowIndex(
            nestedRowsCache.levels[0][i].__children[
            nestedRowsCache.levels[0][i].__children.length - 1
              ]
          ),
        ] as any);
        endpoints.push(tempEndpoint);
      }

      return endpoints;
    },
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
