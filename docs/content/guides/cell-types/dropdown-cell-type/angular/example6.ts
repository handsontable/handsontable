/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-dropdown-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="shipments" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {
  // each `value` is an object, so the cell stores the whole airport, not only its name
  readonly airports = [
    { key: 'LAX', value: { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' } },
    { key: 'JFK', value: { name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' } },
    { key: 'LHR', value: { name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' } },
    { key: 'CDG', value: { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' } },
    { key: 'HND', value: { name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan' } },
    { key: 'SIN', value: { name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' } },
  ];

  readonly shipments = [
    ['Electronics and Gadgets', this.airports[0]],
    ['Medical Supplies', this.airports[1]],
    ['Fresh Produce', this.airports[2]],
    ['Textiles', this.airports[3]],
    ['Pharmaceuticals', this.airports[4]],
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
          type: 'dropdown',
          source: this.airports,
          // display the `name` property of each airport
          sourceLabel: 'name',
          title: 'Destination airport',
          width: 320,
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
