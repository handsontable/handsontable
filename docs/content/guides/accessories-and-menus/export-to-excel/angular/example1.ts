/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

function createExceljsDependency() {
  class WorksheetMock {
    rows: unknown[][] = [];

    addRow(values: unknown[]) {
      this.rows.push(values);
    }
  }

  class WorkbookMock {
    worksheets: WorksheetMock[] = [];

    xlsx = {
      writeBuffer: async(): Promise<ArrayBuffer> => {
        const textEncoder = new TextEncoder();

        return textEncoder.encode(JSON.stringify(this.worksheets.map(({ rows }) => rows))).buffer;
      },
    };

    addWorksheet() {
      const worksheet = new WorksheetMock();

      this.worksheets.push(worksheet);

      return worksheet;
    }
  }

  return {
    Workbook: WorkbookMock,
  };
}

@Component({
  selector: 'app-example1',
  templateUrl: './app.component.html',
  standalone: false
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  readonly hotData = [
    ['A1', 'B1', '=SUM(1,1)'],
    ['A2', 'B2', '=SUM(2,2)'],
    ['A3', 'B3', '=SUM(3,3)'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    exportExcel: {
      exceljs: createExceljsDependency(),
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  async exportFile() {
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportExcel');

    await exportPlugin.downloadFile({
      filename: 'Handsontable-XLSX-file_[YYYY]-[MM]-[DD]',
      sheetName: 'Report',
      formulas: true,
      columnHeaders: true,
      rowHeaders: true,
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
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [AppComponent],
  providers: [...appConfig.providers],
  bootstrap: [AppComponent]
})
export class AppModule { }
/* end-file */
