/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

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
