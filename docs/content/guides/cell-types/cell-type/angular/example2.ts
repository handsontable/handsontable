/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example2CellTypeComponent {

  readonly data = [
    ['empty string', '', '', '', '', ''],
    ['null', null, null, null, null, null],
    ['undefined', undefined, undefined, undefined, undefined, undefined],
    ['non-empty value', 'non-empty text', 13000, true, 'orange', 'password'],
  ];

  readonly gridSettings: GridSettings = {
    autoWrapRow: true,
    autoWrapCol: true,
    columnSorting: {
      sortEmptyCells: true,
    },
    columns: [
      {
        columnSorting: {
          indicator: false,
          headerAction: false,
          compareFunctionFactory: function compareFunctionFactory() {
            return function comparator() {
              return 0; // Don't sort the first visual column.
            };
          },
        },
        readOnly: true,
      },
      {},
      {
        type: 'numeric',
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US',
        },
      },
      { type: 'checkbox' },
      { type: 'dropdown', source: ['yellow', 'red', 'orange'] },
      { type: 'password' },
    ],
    preventOverflow: 'horizontal',
    colHeaders: [
      'value<br>underneath',
      'type:text',
      'type:numeric',
      'type:checkbox',
      'type:dropdown',
      'type:password',
    ],
    height: 'auto'
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
import { Example2CellTypeComponent } from './app.component';
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
  declarations: [ Example2CellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2CellTypeComponent ]
})

export class AppModule { }
/* end-file */
