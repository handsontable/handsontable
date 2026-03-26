/* file: app.component.ts */
import { Component } from '@angular/core';
import { HyperFormula } from 'hyperformula';
/* end-file */
/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotTableModule, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
/* start:skip-in-compilation */
import { AppComponent } from './app.component';

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

// Named expressions that reference cell ranges must be registered after the sheet
// exists. Pre-build the engine in the constructor so the sheet is created first.
let AppComponent = class AppComponent {
  hotData = [
    ['Widget A', 200, 250],
    ['Widget B', 150, 300],
    ['Widget C', 400, 350],
    ['Totals', '=Q1_TOTAL', '=Q2_TOTAL'],
  ];
  hotSettings;
  constructor() {
    const hfInstance = HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
    });

    hfInstance.addSheet('Sheet1');
    hfInstance.addNamedExpression('Q1_TOTAL', '=SUM(Sheet1!$B$1:$B$3)');
    hfInstance.addNamedExpression('Q2_TOTAL', '=SUM(Sheet1!$C$1:$C$3)');
    this.hotSettings = {
      colHeaders: ['Product', 'Q1 Sales', 'Q2 Sales'],
      rowHeaders: true,
      height: 'auto',
      formulas: {
        engine: hfInstance,
        sheetName: 'Sheet1',
      },
      autoWrapRow: true,
      autoWrapCol: true,
    };
  }
};

AppComponent = __decorate(
  [
    Component({
      selector: 'app-example4',
      template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
      standalone: false,
    }),
  ],
  AppComponent
);

export { AppComponent };

/* end:skip-in-compilation */
// register Handsontable's modules
registerAllModules();

export const appConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
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
      declarations: [AppComponent],
      providers: [...appConfig.providers],
      bootstrap: [AppComponent],
    }),
  ],
  AppModule
);

export { AppModule };
/* end-file */
