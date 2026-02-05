/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

const shipmentCategories = [
  'Electronics and Gadgets',
  'Medical Supplies',
  'Auto Parts',
  'Fresh Produce',
  'Textiles',
  'Industrial Equipment',
  'Pharmaceuticals',
  'Consumer Goods',
  'Machine Parts',
  'Food Products',
];

const data = [
  ['Los Angeles International Airport', ['Electronics and Gadgets', 'Medical Supplies']],
  ['Chicago O\'Hare International Airport', ['Auto Parts', 'Fresh Produce']],
  ['Charles de Gaulle Airport', ['Textiles', 'Industrial Equipment']],
  ['Tokyo Haneda Airport', ['Pharmaceuticals', 'Consumer Goods']],
  ['Singapore Changi Airport', ['Machine Parts', 'Food Products']],
];

@Component({
  selector: 'example1-multiselect-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1MultiselectCellTypeComponent {

  readonly data = data;

  readonly gridSettings: GridSettings = {
    height: 200,
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        title: 'Airport',
      },
      {
        type: 'multiselect',
        source: shipmentCategories,
        title: 'Shipment',
      },
    ],
    preventOverflow: 'horizontal',
    colWidths: 300,
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
import { Example1MultiselectCellTypeComponent } from './app.component';
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
  declarations: [ Example1MultiselectCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1MultiselectCellTypeComponent ]
})

export class AppModule { }
/* end-file */
