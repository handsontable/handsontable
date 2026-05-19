/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {
  readonly fruits = [
    'Apple',
    'Apricot',
    'Avocado',
    'Banana',
    'Blueberry',
    'Cherry',
    'Grape',
    'Lemon',
    'Lime',
    'Mango',
    'Orange',
    'Peach',
    'Pear',
    'Pineapple',
    'Plum',
    'Raspberry',
    'Strawberry',
    'Watermelon',
  ];

  readonly data = [
    ['Apple', 'Apple'],
    ['Banana', 'Banana'],
    ['Cherry', 'Cherry'],
    ['Mango', 'Mango'],
    ['Orange', 'Orange'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: ['Filter: true (default)', 'Filter: false'],
    columns: [
      {
        type: 'autocomplete',
        source: this.fruits,
        strict: false,
      },
      {
        type: 'autocomplete',
        source: this.fruits,
        strict: false,
        // don't hide options that don't match the search query
        filter: false,
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
