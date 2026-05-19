/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-checkbox-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

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
