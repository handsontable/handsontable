/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
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
    ['https://handsontable.com', '=WEBSERVICE(A1)'],
    ['https://github.com', '=WEBSERVICE(A2)'],
    ['http://example.com/malicious-script.exe', '=WEBSERVICE(A3)'],
  ];
  hotSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };
  downloadCSVWithNoSanitization() {
    const exportPlugin = this.hotTable.hotInstance.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      colHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
    });
  }
  downloadCSVWithRecommendedSanitization() {
    const exportPlugin = this.hotTable.hotInstance.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      colHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      sanitizeValues: true,
    });
  }
  downloadCSVWithNoSanitization() {
    const exportPlugin = this.hotTable.hotInstance.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      colHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      sanitizeValues: /WEBSERVICE/,
    });
  }
  downloadCSVWithFunctionSanitization() {
    const exportPlugin = this.hotTable.hotInstance.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      colHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      sanitizeValues: (value) => {
        return /WEBSERVICE/.test(value) ? 'REMOVED SUSPICIOUS CELL CONTENT' : value;
      },
    });
  }
};

__decorate([ViewChild(HotTableComponent, { static: false })], AppComponent.prototype, 'hotTable', void 0);
AppComponent = __decorate(
  [
    Component({
      selector: 'app-example4',
      template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="downloadCSVWithNoSanitization()">Download CSV with no sanitization</button>
        <button (click)="downloadCSVWithRecommendedSanitization()">Download CSV with recommended sanitization</button>
        <button (click)="downloadCSVWithRegexpSanitization()">Download CSV with sanitization using a regexp</button>
        <button (click)="downloadCSVWithFunctionSanitization()">Download CSV with sanitization using a function</button>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
      standalone: false,
      encapsulation: ViewEncapsulation.None,
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
