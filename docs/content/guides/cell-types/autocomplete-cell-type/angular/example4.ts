/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="shipmentKVData" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {
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
