/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

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
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

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



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
