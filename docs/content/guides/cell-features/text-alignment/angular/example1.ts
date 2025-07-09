/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-text-alignment',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1TextAlignmentComponent {

  // generate an array of arrays with dummy data
  readonly data = new Array(100) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(18) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  readonly gridSettings: GridSettings = {
    height: 320,
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    mergeCells: [
      { row: 1, col: 1, rowspan: 3, colspan: 3 },
      { row: 3, col: 4, rowspan: 2, colspan: 2 },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    className: 'htCenter',
    cell: [
      { row: 0, col: 0, className: 'htRight' },
      { row: 1, col: 1, className: 'htLeft htMiddle' },
      { row: 3, col: 4, className: 'htLeft htBottom' },
    ],
    afterSetCellMeta: (row, col, key, val) => {
      console.log('cell meta changed', row, col, key, val);
    }
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
import { Example1TextAlignmentComponent } from './app.component';
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
  declarations: [ Example1TextAlignmentComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1TextAlignmentComponent ]
})

export class AppModule { }
/* end-file */
