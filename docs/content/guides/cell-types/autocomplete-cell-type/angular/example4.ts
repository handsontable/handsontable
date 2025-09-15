/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-autocomplete-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="shipmentKVData" [settings]="gridSettings"></hot-table>
  </div>`
})
export class Example4AutocompleteCellTypeComponent {
  readonly shipmentKVData = [
    ['Electronics and Gadgets','Los Angeles International Airport'],
    ['Medical Supplies', 'John F. Kennedy International Airport'],
    ['Auto Parts', 'Chicago O\'Hare International Airport'],
    ['Fresh Produce', 'London Heathrow Airport'],
    ['Textiles', 'Charles de Gaulle Airport'],
    ['Industrial Equipment', 'Dubai International Airport'],
    ['Pharmaceuticals', 'Tokyo Haneda Airport'],
    ['Consumer Goods', 'Beijing Capital International Airport'],
    ['Machine Parts', 'Singapore Changi Airport'],
    ['Food Products', 'Amsterdam Airport Schiphol']
  ];

  readonly airportKVData = [
    'Los Angeles International Airport',
    'John F. Kennedy International Airport',
    'Chicago O\'Hare International Airport',
    'London Heathrow Airport',
    'Charles de Gaulle Airport',
    'Dubai International Airport',
    'Tokyo Haneda Airport',
    'Beijing Capital International Airport',
    'Singapore Changi Airport',
    'Amsterdam Airport Schiphol',
    'Frankfurt Airport',
    'Seoul Incheon International Airport',
    'Toronto Pearson International Airport',
    'Madrid-Barajas Airport',
    'Bangkok Suvarnabhumi Airport',
    'Munich International Airport',
    'Sydney Kingsford Smith Airport',
    'Barcelona-El Prat Airport',
    'Kuala Lumpur International Airport',
    'Zurich Airport'
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        title: 'Shipment',
      },
      {
        type: 'autocomplete',
        source: this.airportKVData,
        title: 'Airport',
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
import { Example4AutocompleteCellTypeComponent } from './app.component';
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
  declarations: [ Example4AutocompleteCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example4AutocompleteCellTypeComponent ]
})

export class AppModule { }
/* end-file */
