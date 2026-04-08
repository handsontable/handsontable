/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example7-autocomplete-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class Example7AutocompleteCellTypeComponent {
  readonly colors = [
    'Black',
    'Blue',
    'brown',
    'cyan',
    'Gray',
    'green',
    'Lime',
    'Magenta',
    'Navy',
    'olive',
    'orange',
    'Pink',
    'Purple',
    'Red',
    'silver',
    'Teal',
    'White',
    'Yellow',
  ];

  readonly data = [
    ['Black', 'Black'],
    ['Blue', 'Blue'],
    ['Gray', 'Gray'],
    ['Red', 'Red'],
    ['White', 'White'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: ['Case-insensitive (default)', 'Case-sensitive'],
    columns: [
      {
        type: 'autocomplete',
        source: this.colors,
        strict: false,
      },
      {
        type: 'autocomplete',
        source: this.colors,
        strict: false,
        // match case while searching autocomplete options
        filteringCaseSensitive: true,
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
import { Example7AutocompleteCellTypeComponent } from './app.component';
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
  declarations: [ Example7AutocompleteCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example7AutocompleteCellTypeComponent ]
})

export class AppModule { }
/* end-file */
