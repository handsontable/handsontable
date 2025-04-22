/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable';

@Component({
  selector: 'example4-configuration-options',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example4ConfigurationOptionsComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data: Handsontable.CellValue[][] = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ];

  readonly gridSettings: GridSettings = {
    autoWrapRow: true,
    autoWrapCol: true,
    readOnly: false,
    width: 'auto',
    height: 'auto',
    rowHeaders: true,
    colHeaders: true,
    cell: [
      {
        // bottom-level cell options overwrite the top-level grid options
        // apply only to a cell with coordinates (0, 0)
        row: 0,
        col: 0,
        readOnly: true,
      },
      {
        // bottom-level cell options overwrite the top-level grid options
        // apply only to a cell with coordinates (1, 1)
        row: 1,
        col: 1,
        readOnly: true,
      },
    ]
  };
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { Example4ConfigurationOptionsComponent } from './app.component';
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
      } as HotConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example4ConfigurationOptionsComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example4ConfigurationOptionsComponent ]
})

export class AppModule { }
/* end-file */
