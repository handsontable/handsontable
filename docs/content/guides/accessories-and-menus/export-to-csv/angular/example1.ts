/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example1',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportFile()">Download CSV</button>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  readonly hotData = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    hiddenRows: { rows: [1, 3, 5], indicators: true },
    hiddenColumns: { columns: [1, 3, 5], indicators: true },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  exportFile() {
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
      rowHeaders: true,
    });
  }
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
