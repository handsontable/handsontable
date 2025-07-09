/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-password-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example3PasswordCellTypeComponent {

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
      { data: 'password', type: 'password', hashSymbol: '&#9632;' },
    ]
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
import { Example3PasswordCellTypeComponent } from './app.component';
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
  declarations: [ Example3PasswordCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3PasswordCellTypeComponent ]
})

export class AppModule { }
/* end-file */
