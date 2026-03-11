/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportFile()">Download XLSX</button>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  readonly hotData = [
    ['Product', 'Price', 'Tax', '=B2*C2'],
    ['Keyboard', 120, 0.23, '=B3*C3'],
    ['Mouse', 60, 0.23, '=B4*C4'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['Name', 'Net', 'VAT', 'VAT value'],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  exportFile() {
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportExcel');

    exportPlugin.downloadFile({
      filename: 'Handsontable-XLSX-file_[YYYY]-[MM]-[DD]',
      columnHeaders: true,
      rowHeaders: true,
      formulas: true,
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

// Register all Handsontable's modules.
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
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
