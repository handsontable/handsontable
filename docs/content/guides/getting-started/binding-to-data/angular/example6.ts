/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-binding-data',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example6BindingDataComponent {

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
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
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
      } as HotGlobalConfig
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
