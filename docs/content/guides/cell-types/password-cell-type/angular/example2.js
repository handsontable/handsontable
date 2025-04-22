/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-password-cell-type',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example2PasswordCellTypeComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    {
      id: 1,
      name: { first: 'Chris', last: 'Right' },
      password: 'plainTextPassword',
    },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['ID', 'First name', 'Last name', 'Password'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'id' },
      { data: 'name.first' },
      { data: 'name.last' },
      { data: 'password', type: 'password', hashLength: 10 },
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
import { Example2PasswordCellTypeComponent } from './app.component';
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
  declarations: [ Example2PasswordCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2PasswordCellTypeComponent ]
})

export class AppModule { }
/* end-file */
