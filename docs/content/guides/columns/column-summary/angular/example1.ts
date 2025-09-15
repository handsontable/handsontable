/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
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
