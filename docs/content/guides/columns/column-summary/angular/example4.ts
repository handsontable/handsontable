/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
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


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
