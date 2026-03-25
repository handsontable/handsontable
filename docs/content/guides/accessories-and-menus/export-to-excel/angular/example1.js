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
  hotTable;
  hotData = [
    ['Alice Martin', 'North', 142000, true, 'Exceeded Q1 target by 18%.'],
    ['Bob Chen', 'East', 98500, true, 'Strong pipeline for Q2.'],
    ['Carol Davies', 'South', 76200, false, 'Needs coaching on closing.'],
    ['David Kim', 'West', 115300, true, 'Cross-sell opportunity.'],
    ['Eva Rossi', 'North', 54800, false, 'Sick leave impacted March.'],
    ['TOTALS', '', null, '', ''],
  ];
  hotSettings = {
    nestedHeaders: [
      [
        { label: 'Sales Representative', colspan: 2, headerClassName: 'htCenter' },
        { label: 'Results', colspan: 2, headerClassName: 'htCenter' },
        { label: 'Notes', colspan: 1, headerClassName: 'htLeft' },
      ],
      ['Name', 'Region', 'Revenue ($)', 'Hit Target?', 'Notes'],
    ],
    columns: [
      { type: 'text' },
      { type: 'dropdown', source: ['North', 'South', 'East', 'West'] },
      {
        type: 'numeric',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
      },
      { type: 'checkbox' },
      { type: 'text' },
    ],
    columnSummary: [
      {
        sourceColumn: 2,
        destinationRow: 5,
        destinationColumn: 2,
        type: 'sum',
        forceNumeric: true,
      },
    ],
    mergeCells: [{ row: 5, col: 0, rowspan: 1, colspan: 2 }],
    customBorders: [{ row: 5, col: 2, top: { width: 2, color: '#333333' } }],
    cell: [
      { row: 5, col: 0, readOnly: true },
      { row: 5, col: 2, readOnly: true },
    ],
    fixedColumnsStart: 1,
    rowHeaders: true,
    colHeaders: false,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    exportFile: { engines: { xlsx: ExcelJS } },
  };
  onAfterInit() {
    const hot = this.hotTable.hotInstance;

    hot.setCellMeta(0, 4, 'comment', { value: 'Top sales rep — review for promotion.' });
    hot.render();
  }
  async exportFile() {
    const exportPlugin = this.hotTable.hotInstance.getPlugin('exportFile');

    await exportPlugin.downloadFileAsync('xlsx', {
      filename: 'Q1-Sales-Report',
      colHeaders: true,
      rowHeaders: true,
      exportFormulas: true,
    });
  }
};

__decorate([ViewChild(HotTableComponent, { static: false })], AppComponent.prototype, 'hotTable', void 0);
AppComponent = __decorate(
  [
    Component({
      selector: 'app-example1',
      template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportFile()">Export XLSX</button>
      </div>
    </div>

    <hot-table [settings]="hotSettings!" [data]="hotData" (afterInit)="onAfterInit()">
    </hot-table>
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
