/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-merge-cells',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example2MergeCellsComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = new Array(50) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(500) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  readonly gridSettings: GridSettings = {
    height: 320,
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    mergeCells: {
      virtualized: true,
      cells: [{ row: 1, col: 1, rowspan: 3, colspan: 498 }],
    },
    viewportColumnRenderingOffset: 15,
    viewportColumnRenderingThreshold: 5,
    autoWrapRow: true,
    autoWrapCol: true
  };
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { Example2MergeCellsComponent } from './app.component';
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
      } as HotConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example2MergeCellsComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2MergeCellsComponent ]
})

export class AppModule { }
/* end-file */
