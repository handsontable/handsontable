/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-time-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1TimeCellTypeComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['Mercedes', 'A 160', 1332284400000, 6999.95],
    ['Citroen', 'C4 Coupe', '10 30', 8330],
    ['Audi', 'A4 Avant', '8:00 PM', 33900],
    ['Opel', 'Astra', 1332284400000, 7000],
    ['BMW', '320i Coupe', 1332284400000, 30500],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car', 'Model', 'Registration date', 'Price'],
    columnSorting: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'text',
      },
      {
        // 2nd cell is simple text, no special options here
      },
      {
        type: 'time',
        timeFormat: 'h:mm:ss a',
        correctFormat: true,
      },
      {
        type: 'numeric',
        numericFormat: {
          pattern: '$ 0,0.00',
        },
      },
    ]
  };

  ngAfterViewInit(): void {
    this.hotTable.hotInstance?.validateCells();
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
import { Example1TimeCellTypeComponent } from './app.component';
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
  declarations: [ Example1TimeCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1TimeCellTypeComponent ]
})

export class AppModule { }
/* end-file */
