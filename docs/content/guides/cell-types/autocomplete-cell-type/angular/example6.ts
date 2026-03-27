/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-autocomplete-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class Example6AutocompleteCellTypeComponent {
  readonly fruits = [
    'Apple',
    'Apricot',
    'Avocado',
    'Banana',
    'Blueberry',
    'Cherry',
    'Grape',
    'Lemon',
    'Lime',
    'Mango',
    'Orange',
    'Peach',
    'Pear',
    'Pineapple',
    'Plum',
    'Raspberry',
    'Strawberry',
    'Watermelon',
  ];

  readonly data = [
    ['Apple', 'Apple'],
    ['Banana', 'Banana'],
    ['Cherry', 'Cherry'],
    ['Mango', 'Mango'],
    ['Orange', 'Orange'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: ['Filter: true (default)', 'Filter: false'],
    columns: [
      {
        type: 'autocomplete',
        source: this.fruits,
        strict: false,
      },
      {
        type: 'autocomplete',
        source: this.fruits,
        strict: false,
        // don't hide options that don't match the search query
        filter: false,
      },
    ],
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
import { Example6AutocompleteCellTypeComponent } from './app.component';
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
  declarations: [ Example6AutocompleteCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example6AutocompleteCellTypeComponent ]
})

export class AppModule { }
/* end-file */
