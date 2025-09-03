/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent implements OnInit {

  hotData: number[][] = [];

  readonly hotSettings: GridSettings = {
    height: 'auto',
    rowHeaders: true,
    colHeaders: ['sum', 'min', 'max', 'count', 'average'],
    // set the `columnSummary` configuration option to a function
    // @ts-ignore
    columnSummary() {
      const configArray = [];
      const summaryTypes = ['sum', 'min', 'max', 'count', 'average'];

      for (let i = 0; i < this.hot.countCols(); i++) {
        // iterate over visible columns
        // for each visible column, add a column summary with a configuration
        configArray.push({
          sourceColumn: i,
          type: summaryTypes[i],
          // count row coordinates backward
          reversedRowCoords: true,
          // display the column summary in the bottom row (because of the reversed row coordinates)
          destinationRow: 0,
          destinationColumn: i,
          forceNumeric: true,
        });
      }

      return configArray;
    },
    autoWrapRow: true,
    autoWrapCol: true,
  };

  ngOnInit() {
    // initialize a Handsontable instance with the generated data
    this.hotData = this.generateData(5, 5, true);
  }

  private generateData = (rows = 3, columns = 7, additionalRows = true) => {
    let counter = 0;
    const array2d = [...new Array(rows)].map((_) =>
      [...new Array(columns)].map((_) => counter++)
    );

    // add an empty row at the bottom, to display column summaries
    if (additionalRows) {
      array2d.push([]);
    }

    return array2d;
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
