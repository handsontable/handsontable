/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['empty string', '', '', '', '', ''],
    ['null', null, null, null, null, null],
    ['undefined', undefined, undefined, undefined, undefined, undefined],
    ['non-empty value', 'non-empty text', 13000, true, 'orange', 'password'],
  ];

  readonly gridSettings: GridSettings = {
    autoWrapRow: true,
    autoWrapCol: true,
    columnSorting: {
      sortEmptyCells: true,
    },
    columns: [
      {
        columnSorting: {
          indicator: false,
          headerAction: false,
          compareFunctionFactory: function compareFunctionFactory() {
            return function comparator() {
              return 0; // Don't sort the first visual column.
            };
          },
        },
        readOnly: true,
      },
      {},
      {
        type: 'numeric',
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
      { type: 'checkbox' },
      { type: 'dropdown', source: ['yellow', 'red', 'orange'] },
      { type: 'password' },
    ],
    preventOverflow: 'horizontal',
    colHeaders: [
      'value<br>underneath',
      'type:text',
      'type:numeric',
      'type:checkbox',
      'type:dropdown',
      'type:password',
    ],
    height: 'auto'
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
