/* file: app.component.ts */
import { Component, ViewEncapsulation } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-selection',
  standalone: false,
  styles: [`
    #example4 td.area { background-color: rgba(75, 137, 255, 0.2); }
    #example4 td.area.area-1 { background-color: rgba(75, 137, 255, 0.4); }
    #example4 td.area.area-2 { background-color: rgba(75, 137, 255, 0.6); }
  `],
  template: `<div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
  encapsulation: ViewEncapsulation.None
})
export class Example4SelectionComponent {
  readonly data = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6'],
  ];

  readonly gridSettings: GridSettings = {
    width: 'auto',
    height: 'auto',
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    outsideClickDeselects: false,
    selectionMode: 'multiple',
    autoWrapRow: true,
    autoWrapCol: true,
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
import { Example4SelectionComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
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
  declarations: [ Example4SelectionComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example4SelectionComponent ]
})

export class AppModule { }
/* end-file */
