/* file: app.component.ts */
import { Component } from '@angular/core';
/* end-file */
/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import {
  HOT_GLOBAL_CONFIG,
  HotTableModule,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
/* start:skip-in-compilation */
import { AppComponent } from './app.component';

const __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    const c = arguments.length;
    let r =
      c < 3
        ? target
        : desc === null
        ? (desc = Object.getOwnPropertyDescriptor(target, key))
        : desc;

    let d;

    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (let i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

let AppComponent = class AppComponent {
  ngOnInit() {
    this.hotSettings = {
      data: [
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
        ['A3', 'B3', 'C3', 'D3'],
      ],
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      height: 'auto',
      headerClassName: 'htLeft',
      columns: [
        { headerClassName: 'italic-text' },
        { headerClassName: 'bold-text italic-text' },
        { headerClassName: 'htRight bold-text italic-text' },
        {},
      ],
    };
  }
};

AppComponent = __decorate(
  [
    Component({
      selector: 'app-example5',
      template: `
    <hot-table
      [settings]="hotSettings!">
    </hot-table>
  `,
      styles: `
    :host ::ng-deep {
      .bold-text {
        font-weight: bold;
      }
      .italic-text {
          font-style: italic;
      }
    }
  `,
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
      imports: [
        BrowserModule,
        HotTableModule,
        CommonModule,
        ReactiveFormsModule,
      ],
      declarations: [AppComponent],
      providers: [...appConfig.providers],
      bootstrap: [AppComponent],
    }),
  ],
  AppModule
);

export { AppModule };
/* end-file */
