/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example5-autocomplete-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="shipmentKVData" [settings]="gridSettings"></hot-table>
  </div>`
})
export class Example5AutocompleteCellTypeComponent {
  readonly shipmentKVData = [
    [
      'Electronics and Gadgets',
      { key: 'LAX', value: 'Los Angeles International Airport' },
    ],
    [
      'Medical Supplies',
      { key: 'JFK', value: 'John F. Kennedy International Airport' }
    ],
    [
      'Auto Parts',
      { key: 'ORD', value: "Chicago O'Hare International Airport" }
    ],
    [
      'Fresh Produce',
      { key: 'LHR', value: 'London Heathrow Airport' }
    ],
    [
      'Textiles',
      { key: 'CDG', value: 'Charles de Gaulle Airport' }
    ],
    [
      'Industrial Equipment',
      { key: 'DXB', value: 'Dubai International Airport' }
    ],
    [
      'Pharmaceuticals',
      { key: 'HND', value: 'Tokyo Haneda Airport' }
    ],
    [
      'Consumer Goods',
      { key: 'PEK', value: 'Beijing Capital International Airport' }
    ],
    [
      'Machine Parts',
      { key: 'SIN', value: 'Singapore Changi Airport' }
    ],
    [
      'Food Products',
      { key: 'AMS', value: 'Amsterdam Airport Schiphol' }
    ]
  ];

  readonly airportKVData = [
    { key: 'LAX', value: 'Los Angeles International Airport' },
    { key: 'JFK', value: 'John F. Kennedy International Airport' },
    { key: 'ORD', value: "Chicago O'Hare International Airport" },
    { key: 'LHR', value: 'London Heathrow Airport' },
    { key: 'CDG', value: 'Charles de Gaulle Airport' },
    { key: 'DXB', value: 'Dubai International Airport' },
    { key: 'HND', value: 'Tokyo Haneda Airport' },
    { key: 'PEK', value: 'Beijing Capital International Airport' },
    { key: 'SIN', value: 'Singapore Changi Airport' },
    { key: 'AMS', value: 'Amsterdam Airport Schiphol' },
    { key: 'FRA', value: 'Frankfurt Airport' },
    { key: 'ICN', value: 'Seoul Incheon International Airport' },
    { key: 'YYZ', value: 'Toronto Pearson International Airport' },
    { key: 'MAD', value: 'Madrid-Barajas Airport' },
    { key: 'BKK', value: 'Bangkok Suvarnabhumi Airport' },
    { key: 'MUC', value: 'Munich International Airport' },
    { key: 'SYD', value: 'Sydney Kingsford Smith Airport' },
    { key: 'BCN', value: 'Barcelona-El Prat Airport' },
    { key: 'KUL', value: 'Kuala Lumpur International Airport' },
    { key: 'ZRH', value: 'Zurich Airport' }
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
import { Example5AutocompleteCellTypeComponent } from './app.component';
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
  declarations: [ Example5AutocompleteCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example5AutocompleteCellTypeComponent ]
})

export class AppModule { }
/* end-file */
