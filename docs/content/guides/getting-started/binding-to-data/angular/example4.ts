/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

interface Person {
  id: number;
  name?: { first: string; last: string };
  address: string;
}

@Component({
  selector: 'example4-binding-data',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example4BindingDataComponent {

  readonly data: Person[] = [
    { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
    { id: 2, address: '' }, // Handsontable will create missing properties on demand
    { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    height: 'auto',
    width: 'auto',
    columns: (columnIndex: number) => {
      switch (columnIndex) {
        case 0:
          return { data: 'id' };
        case 1:
          return { data: 'name.first' };
        case 2:
          return { data: 'name.last' };
        case 3:
          return { data: 'address' };
        default:
          return {};
      }
    },
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
import { Example4BindingDataComponent } from './app.component';
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
  declarations: [ Example4BindingDataComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example4BindingDataComponent ]
})

export class AppModule { }
/* end-file */
