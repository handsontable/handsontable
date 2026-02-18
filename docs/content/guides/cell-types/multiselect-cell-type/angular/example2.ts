/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

const shipmentCategories = [
  { key: 'electronics', value: 'Electronics and Gadgets' },
  { key: 'medical', value: 'Medical Supplies' },
  { key: 'auto-parts', value: 'Auto Parts' },
  { key: 'fresh-produce', value: 'Fresh Produce' },
  { key: 'textiles', value: 'Textiles' },
  { key: 'industrial', value: 'Industrial Equipment' },
  { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
  { key: 'consumer', value: 'Consumer Goods' },
  { key: 'machine-parts', value: 'Machine Parts' },
  { key: 'food', value: 'Food Products' },
];

const data = [
  ['Los Angeles International Airport', [
    { key: 'electronics', value: 'Electronics and Gadgets' },
    { key: 'medical', value: 'Medical Supplies' },
  ]],
  ['Chicago O\'Hare International Airport', [
    { key: 'auto-parts', value: 'Auto Parts' },
    { key: 'fresh-produce', value: 'Fresh Produce' },
  ]],
  ['Charles de Gaulle Airport', [
    { key: 'textiles', value: 'Textiles' },
    { key: 'industrial', value: 'Industrial Equipment' },
  ]],
  ['Tokyo Haneda Airport', [
    { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
    { key: 'consumer', value: 'Consumer Goods' },
  ]],
  ['Singapore Changi Airport', [
    { key: 'machine-parts', value: 'Machine Parts' },
    { key: 'food', value: 'Food Products' },
  ]],
];

@Component({
  selector: 'example2-multiselect-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example2MultiselectCellTypeComponent {

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
import { Example2MultiselectCellTypeComponent } from './app.component';
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
  declarations: [ Example2MultiselectCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2MultiselectCellTypeComponent ]
})

export class AppModule { }
/* end-file */
