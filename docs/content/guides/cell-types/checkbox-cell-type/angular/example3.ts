/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-checkbox-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example3CheckboxCellTypeComponent {

  readonly data = [
    {
      car: 'Mercedes A 160',
      year: 2017,
      available: true,
      comesInBlack: 'yes',
    },
    {
      car: 'Citroen C4 Coupe',
      year: 2018,
      available: false,
      comesInBlack: 'yes',
    },
    {
      car: 'Audi A4 Avant',
      year: 2019,
      available: true,
      comesInBlack: 'no',
    },
    {
      car: 'Opel Astra',
      year: 2020,
      available: false,
      comesInBlack: 'yes',
    },
    {
      car: 'BMW 320i Coupe',
      year: 2021,
      available: false,
      comesInBlack: 'no',
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car model', 'Accepted', 'Comes in black'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        data: 'car',
      },
      {
        data: 'available',
        type: 'checkbox',
        label: {
          position: 'after',
          property: 'car', // Read value from row object
        },
      },
      {
        data: 'comesInBlack',
        type: 'checkbox',
        checkedTemplate: 'yes',
        uncheckedTemplate: 'no',
        label: {
          position: 'before',
          value: 'In black? ',
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
import { Example3CheckboxCellTypeComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main-dark-auto',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example3CheckboxCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3CheckboxCellTypeComponent ]
})

export class AppModule { }
/* end-file */
