/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example7-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {
  readonly colors = [
    'Black',
    'Blue',
    'brown',
    'cyan',
    'Gray',
    'green',
    'Lime',
    'Magenta',
    'Navy',
    'olive',
    'orange',
    'Pink',
    'Purple',
    'Red',
    'silver',
    'Teal',
    'White',
    'Yellow',
  ];

  readonly data = [
    ['Black', 'Black'],
    ['Blue', 'Blue'],
    ['Gray', 'Gray'],
    ['Red', 'Red'],
    ['White', 'White'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: ['Case-insensitive (default)', 'Case-sensitive'],
    columns: [
      {
        type: 'autocomplete',
        source: this.colors,
        strict: false,
      },
      {
        type: 'autocomplete',
        source: this.colors,
        strict: false,
        // match case while searching autocomplete options
        filteringCaseSensitive: true,
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
