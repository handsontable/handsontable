/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-checkbox-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example4CheckboxCellTypeComponent {

  readonly data = [
    { car: 'Mercedes A 160', year: 2017, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, comesInBlack: 'no' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car model', 'Year', 'Comes in black'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        data: 'car',
      },
      {
        data: 'year',
      },
      {
        data: 'comesInBlack',
        type: 'checkbox',
        checkedTemplate: 'yes',
        uncheckedTemplate: 'no',
        label: {
          position: 'after',
          value: function(
            _row: number,
            _column: number,
            _prop: string | number,
            value: string
          ) {
            if (value === 'yes') {
              return 'In black';
            } else {
              return 'Not in black';
            }
          },
        },
      },
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
import { Example4CheckboxCellTypeComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example4CheckboxCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example4CheckboxCellTypeComponent ]
})

export class AppModule { }
/* end-file */
