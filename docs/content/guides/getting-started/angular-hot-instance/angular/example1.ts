/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-instance-access',
  standalone: false,
  template: ` <div class="controls">
      <button (click)="selectCell()">Select cell B2</button>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class Example1InstanceAccessComponent {
  @ViewChild(HotTableComponent, { static: true }) readonly hotTable!: HotTableComponent;

  readonly data: string[][] = [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  selectCell(): void {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    this.hotTable?.hotInstance?.selectCell(1, 1);
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
import { Example1InstanceAccessComponent } from './app.component';
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
  declarations: [ Example1InstanceAccessComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1InstanceAccessComponent ]
})

export class AppModule { }
/* end-file */
