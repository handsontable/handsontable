/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

const colorData = [
  ['yellow'],
  ['red'],
  ['orange'],
  ['green'],
  ['blue'],
  ['gray'],
  ['black'],
  ['white'],
];

const manufacturerData = [
  { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
  { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
  { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
  { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
  { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
  { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' },
];

@Component({
  selector: 'example1-handsontable-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1HandsontableCellTypeComponent {

  readonly data = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'handsontable',
        handsontable: {
          colHeaders: ['Marque', 'Country', 'Parent company'],
          autoColumnSize: true,
          data: manufacturerData,
          getValue() {
            const selection = this.getSelectedLast();

            // Get the manufacturer name of the clicked row and ignore header
            // coordinates (negative values)
            return this.getSourceDataAtRow(Math.max(selection[0], 0)).name;
          },
        },
      },
      { type: 'numeric' },
      {
        type: 'handsontable',
        handsontable: {
          colHeaders: false,
          data: colorData,
        },
      },
      {
        type: 'handsontable',
        handsontable: {
          colHeaders: false,
          data: colorData,
        },
      },
    ]
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
import { Example1HandsontableCellTypeComponent } from './app.component';
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
  declarations: [ Example1HandsontableCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1HandsontableCellTypeComponent ]
})

export class AppModule { }
/* end-file */
