/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

/* start:skip-in-preview */
const ROWS = 85;
const data = Array.from({ length: ROWS }, (_, row) => [
  `SKU-${1000 + row}`,
  `Product ${row + 1}`,
  row % 12 + 1,
  (9.99 + row * 0.25).toFixed(2),
  ((row % 12 + 1) * (9.99 + row * 0.25)).toFixed(2),
]);
/* end:skip-in-preview */

@Component({
  selector: 'example1-export-to-pdf',
  standalone: false,
  template: `
    <div class="export-pdf-toolbar">
      <button type="button" class="export-pdf-btn" (click)="exportToPdf()">Export to PDF</button>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class Example1ExportToPdfComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Qty', 'Unit price', 'Line total'],
    columnSorting: true,
    rowHeaders: true,
    height: 320,
    width: '100%',
  };

  exportToPdf(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    const body = hot.getData();
    const colCount = hot.countCols();
    const head = [
      Array.from({ length: colCount }, (_, col) => String(hot.getColHeader(col))),
    ];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    autoTable(doc, {
      head,
      body,
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: {
        fillColor: [26, 66, 232],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 14, left: 12, right: 12, bottom: 14 },
      showHead: 'everyPage',
    });

    doc.save('export.pdf');
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
import { Example1ExportToPdfComponent } from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig }],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1ExportToPdfComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1ExportToPdfComponent],
})
export class AppModule {}
/* end-file */
