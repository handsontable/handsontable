/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-autofill-values',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example2AutofillValuesComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13],
    ['2020', '', '', '', ''],
    ['2021', '', '', '', ''],
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    fillHandle: {
      direction: 'vertical',
      autoInsertRow: true,
    },
    height: 'auto',
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
import { Example2AutofillValuesComponent } from './app.component';
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
  declarations: [ Example2AutofillValuesComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2AutofillValuesComponent ]
})

export class AppModule { }
/* end-file */
