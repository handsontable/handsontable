/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

const colors = [
  'yellow',
  'red',
  'orange and another color',
  'green',
  'blue',
  'gray',
  'black',
  'white',
  'purple',
  'lime',
  'olive',
  'cyan',
];

@Component({
  selector: 'example1-autocomplete-cell-type',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [settings]="gridSettings" />
  </div>`,
})
export class Example1AutocompleteCellTypeComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'autocomplete',
        source: ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'],
        strict: false,
      },
      { type: 'numeric' },
      {
        type: 'autocomplete',
        source: colors,
        strict: false,
        visibleRows: 4,
      },
      {
        type: 'autocomplete',
        source: colors,
        strict: false,
        trimDropdown: false,
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
import { Example1AutocompleteCellTypeComponent } from './app.component';
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
  declarations: [ Example1AutocompleteCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1AutocompleteCellTypeComponent ]
})

export class AppModule { }
/* end-file */
