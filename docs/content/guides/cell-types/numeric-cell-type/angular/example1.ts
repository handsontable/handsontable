/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-numeric-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1NumericCellTypeComponent {

  readonly data = [
    { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
    {
      car: 'Citroen C4 Coupe',
      year: 2018,
      price_usd: 8330,
      price_eur: 8330,
    },
    {
      car: 'Audi A4 Avant',
      year: 2019,
      price_usd: 33900,
      price_eur: 33900,
    },
    { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
    {
      car: 'BMW 320i Coupe',
      year: 2021,
      price_usd: 30500,
      price_eur: 30500,
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car', 'Year', 'Price ($)', 'Price (€)'],
    columnSorting: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        data: 'car',
        // 1st column is simple text, no special options here
      },
      {
        data: 'year',
        type: 'numeric',
      },
      {
        data: 'price_usd',
        type: 'numeric',
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US', // this is the default culture, set up for USD
        },
        allowEmpty: false,
      },
      {
        data: 'price_eur',
        type: 'numeric',
        numericFormat: {
          pattern: '0,0.00 $',
          culture: 'de-DE', // use this for EUR (German),
          // more cultures available on http://numbrojs.com/languages.html
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
import { Example1NumericCellTypeComponent } from './app.component';
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
  declarations: [ Example1NumericCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1NumericCellTypeComponent ]
})

export class AppModule { }
/* end-file */
