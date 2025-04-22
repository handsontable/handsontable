/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-select-cell-type',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example1SelectCellTypeComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    ['2017', 'Honda', 10],
    ['2018', 'Toyota', 20],
    ['2019', 'Nissan', 30],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colWidths: [50, 70, 50],
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {},
      {
        type: 'select',
        selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda'],
      },
      {},
    ]
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
import { Example1SelectCellTypeComponent } from './app.component';
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
  declarations: [ Example1SelectCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1SelectCellTypeComponent ]
})

export class AppModule { }
/* end-file */
