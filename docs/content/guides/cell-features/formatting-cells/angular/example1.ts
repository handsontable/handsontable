/* file: app.component.ts */
import { Component, ViewEncapsulation } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-formatting-cells',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
  styles: `hot-table td.custom-cell {
    color: #fff !important;
    background-color: #254ac6 !important;
}
hot-table .custom-table thead th:nth-child(even),
hot-table .custom-table tbody tr:nth-child(odd) th {
    color: #fff !important;
    background-color: #254ac6 !important;
}
`,
  encapsulation: ViewEncapsulation.None,
})
export class Example1FormattingCellsComponent {

  readonly data = [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    className: 'custom-table',
    cell: [
      {
        row: 0,
        col: 0,
        className: 'custom-cell',
      },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };
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
import { Example1FormattingCellsComponent } from './app.component';
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
  declarations: [ Example1FormattingCellsComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1FormattingCellsComponent ]
})

export class AppModule { }
/* end-file */
