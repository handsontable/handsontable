/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-checkbox-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    { car: 'Mercedes A 160', year: 2017, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, comesInBlack: 'no' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car model', 'Year', 'Comes in black'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        data: 'car',
      },
      {
        data: 'year',
      },
      {
        data: 'comesInBlack',
        type: 'checkbox',
        checkedTemplate: 'yes',
        uncheckedTemplate: 'no',
        label: {
          position: 'after',
          value: (function(
            row: number,
            column: number,
            prop: string | number,
            value: unknown
          ) {
            if (value === 'yes') {
              return 'In black';
            } else {
              return 'Not in black';
            }
          }) as unknown as () => string,
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
