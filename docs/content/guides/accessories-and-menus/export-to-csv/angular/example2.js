/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  HotTableComponent,
  HOT_GLOBAL_CONFIG,
  HotTableModule,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';
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
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'],
  ];
  hotSettings = {
    colHeaders: true,
    rowHeaders: true,
    hiddenRows: { rows: [1, 3, 5], indicators: true },
    hiddenColumns: { columns: [1, 3, 5], indicators: true },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };
  exportBlob() {
    const exportPlugin = this.hotTable.hotInstance.getPlugin('exportFile');
    const exportedBlob = exportPlugin.exportAsBlob('csv', {
      bom: false,
      columnDelimiter: ',',
      colHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      rowHeaders: true,
    });

    console.log(exportedBlob);
  }
};

__decorate([ViewChild(HotTableComponent, { static: false })], AppComponent.prototype, 'hotTable', void 0);
AppComponent = __decorate(
  [
    Component({
      selector: 'app-example2',
      template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportBlob()">Export as a Blob</button>
      </div>
    </div>

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
