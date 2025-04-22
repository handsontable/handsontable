/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-binding-data',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example6BindingDataComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [];
  readonly gridSettings: GridSettings = {
    dataSchema: {
      id: null,
      name: {
        first: null,
        last: null,
      },
      address: null,
    },
    startRows: 5,
    startCols: 4,
    colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
    height: 'auto',
    width: 'auto',
    columns: [
      { data: 'id' },
      { data: 'name.first' },
      { data: 'name.last' },
      { data: 'address' },
    ],
    minSpareRows: 1,
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
import { Example6BindingDataComponent } from './app.component';
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
  declarations: [ Example6BindingDataComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example6BindingDataComponent ]
})

export class AppModule { }
/* end-file */
