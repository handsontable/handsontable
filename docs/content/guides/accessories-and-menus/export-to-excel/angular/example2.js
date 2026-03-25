/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  HotTableComponent,
  HOT_GLOBAL_CONFIG,
  HotTableModule,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';
import ExcelJS from 'exceljs';
/* end-file */
/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
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

let AppComponent = class AppComponent {
  hotQ2;
  hotQ1;
  q1Data = [
    ['Alice Martin', 'North', 142000, true],
    ['Bob Chen', 'East', 98500, true],
    ['Carol Davies', 'South', 76200, false],
    ['David Kim', 'West', 115300, true],
    ['Eva Rossi', 'North', 54800, false],
  ];
  q2Data = [
    ['Alice Martin', 'North', 158000, true],
    ['Bob Chen', 'East', 112400, true],
    ['Carol Davies', 'South', 89100, true],
    ['David Kim', 'West', 97600, false],
    ['Eva Rossi', 'North', 63200, true],
  ];
  sharedSettings = {
    columns: [
      { type: 'text' },
      { type: 'dropdown', source: ['North', 'South', 'East', 'West'] },
      {
        type: 'numeric',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
      },
      { type: 'checkbox' },
    ],
    colHeaders: ['Name', 'Region', 'Revenue ($)', 'Hit Target?'],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    exportFile: { engines: { xlsx: ExcelJS } },
  };
  async exportSheets() {
    const hotQ1 = this.hotQ1.hotInstance;
    const exportPlugin = hotQ1.getPlugin('exportFile');

    await exportPlugin.downloadFileAsync('xlsx', {
      filename: 'Annual-Sales-Report',
      sheets: [
        { instance: hotQ1, name: 'Q1 Sales', colHeaders: true, rowHeaders: true },
        { instance: this.hotQ2.hotInstance, name: 'Q2 Sales', colHeaders: true, rowHeaders: true },
      ],
    });
  }
};

__decorate([ViewChild('hotQ2', { static: false })], AppComponent.prototype, 'hotQ2', void 0);
__decorate([ViewChild(HotTableComponent, { static: false })], AppComponent.prototype, 'hotQ1', void 0);
AppComponent = __decorate(
  [
    Component({
      selector: 'app-example2',
      template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportSheets()">Export XLSX</button>
      </div>
    </div>

    <p><strong>Q1 Sales</strong></p>
    <hot-table [settings]="sharedSettings" [data]="q1Data"></hot-table>

    <p><strong>Q2 Sales</strong></p>
    <hot-table #hotQ2 [settings]="sharedSettings" [data]="q2Data"></hot-table>
  `,
      standalone: false,
    }),
  ],
  AppComponent
);

export { AppComponent };

/* end:skip-in-compilation */
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
