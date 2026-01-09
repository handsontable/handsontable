/* file: app.component.ts */
import { Component } from '@angular/core';
/* end-file */
/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotTableModule, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
/* start:skip-in-compilation */
import { Example2CellTypeComponent } from './app.component';

const __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    const c = arguments.length;
    let r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc;
    let d;

    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (let i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

let Example2CellTypeComponent = class Example2CellTypeComponent {
  data = [
    ['empty string', '', '', '', '', ''],
    ['null', null, null, null, null, null],
    ['undefined', undefined, undefined, undefined, undefined, undefined],
    ['non-empty value', 'non-empty text', 13000, true, 'orange', 'password'],
  ];
  gridSettings = {
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
          style: 'currency',
          currency: 'USD',
        },
      },
      { type: 'checkbox' },
      { type: 'dropdown', source: ['yellow', 'red', 'orange'] },
      { type: 'password' },
    ],
    preventOverflow: 'horizontal',
    colHeaders: ['value<br>underneath', 'type:text', 'type:numeric', 'type:checkbox', 'type:dropdown', 'type:password'],
    height: 'auto',
  };
};

Example2CellTypeComponent = __decorate(
  [
    Component({
      selector: 'example2-cell-type',
      standalone: false,
      template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
    }),
  ],
  Example2CellTypeComponent
);

export { Example2CellTypeComponent };

/* end:skip-in-compilation */
// register Handsontable's modules
registerAllModules();

export const appConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      },
    },
  ],
};
let AppModule = class AppModule {};

AppModule = __decorate(
  [
    NgModule({
      imports: [BrowserModule, HotTableModule, CommonModule],
      declarations: [Example2CellTypeComponent],
      providers: [...appConfig.providers],
      bootstrap: [Example2CellTypeComponent],
    }),
  ],
  AppModule
);

export { AppModule };
/* end-file */
