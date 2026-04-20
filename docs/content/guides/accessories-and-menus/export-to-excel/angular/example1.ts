/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import ExcelJS from 'exceljs';

@Component({
  selector: 'app-example1',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="exportFile()">Export XLSX</button>
      </div>
    </div>

    <hot-table [settings]="hotSettings" [data]="hotData">
    </hot-table>
  `,
  standalone: false,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  readonly hotData = [
    ['Alice Martin',  'North', 142000, true,  'Exceeded Q1 target by 18%.'],
    ['Bob Chen',      'East',   98500, true,  'Strong pipeline for Q2.'],
    ['Carol Davies',  'South',  76200, false, 'Needs coaching on closing.'],
    ['David Kim',     'West',  115300, true,  'Cross-sell opportunity.'],
    ['Eva Rossi',     'North',  54800, false, 'Sick leave impacted March.'],
    ['TOTALS',        '',       null,  '',    ''],
  ];

  readonly hotSettings: GridSettings = {
    nestedHeaders: [
      [
        { label: 'Sales Representative', colspan: 2, headerClassName: 'htCenter' },
        { label: 'Results',              colspan: 2, headerClassName: 'htCenter' },
        { label: 'Notes',                colspan: 1, headerClassName: 'htLeft'  },
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
    afterInit() {
      const hot = this;

      // @ts-ignore
      hot.setCellMeta(0, 4, 'comment', { value: 'Top sales rep — review for promotion.' });
      // @ts-ignore
      hot.render();
    },
  };

  async exportFile(): Promise<void> {
    const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

    await exportPlugin.downloadFileAsync('xlsx', {
      filename: 'Q1-Sales-Report',
      colHeaders: true,
      rowHeaders: true,
      exportFormulas: true,
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
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [AppComponent],
  providers: [...appConfig.providers],
  bootstrap: [AppComponent],
})
export class AppModule {}
/* end-file */
