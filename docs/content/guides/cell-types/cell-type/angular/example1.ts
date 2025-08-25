/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { BaseRenderer } from 'handsontable/renderers';

const yellowRenderer: BaseRenderer = (instance, td, ...rest) => {
  Handsontable.renderers.TextRenderer(instance, td, ...rest);
  td.style.backgroundColor = 'yellow';
};

const greenRenderer: BaseRenderer = (instance, td, ...rest) => {
  Handsontable.renderers.TextRenderer(instance, td, ...rest);

  td.style.backgroundColor = 'green';
};

const colors: string[] = [
  'yellow',
  'red',
  'orange',
  'green',
  'blue',
  'gray',
  'black',
  'white',
];

@Component({
  selector: 'example1-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1CellTypeComponent {

  readonly data = [
    {
      id: 1,
      name: 'Ted',
      isActive: true,
      color: 'orange',
      date: '2015-01-01',
    },
    { id: 2, name: 'John', isActive: false, color: 'black', date: null },
    { id: 3, name: 'Al', isActive: true, color: 'red', date: null },
    { id: 4, name: 'Ben', isActive: false, color: 'blue', date: null },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'id', type: 'text' },
      // 'text' is default, you don't actually need to declare it
      { data: 'name', renderer: yellowRenderer },
      // use default 'text' cell type but overwrite its renderer with yellowRenderer
      { data: 'isActive', type: 'checkbox' },
      { data: 'date', type: 'date', dateFormat: 'YYYY-MM-DD' },
      { data: 'color', type: 'autocomplete', source: colors },
    ],
    cell: [{ row: 1, col: 0, renderer: greenRenderer }],
    cells: (row, col) => {
      if (row === 0 && col === 0) {
        return { renderer: greenRenderer };
      }

      return {};
    },
    height: 'auto'
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
import { Example1CellTypeComponent } from './app.component';
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
  declarations: [ Example1CellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1CellTypeComponent ]
})

export class AppModule { }
/* end-file */
