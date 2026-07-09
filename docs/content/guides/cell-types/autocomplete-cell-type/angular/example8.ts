/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example8-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`
})
export class AppComponent {
  readonly statuses = [
    'Backlog',
    'In progress',
    'Blocked',
    'Done',
    'Cancelled',
  ];

  readonly data = [
    ['Backlog', 'Backlog'],
    ['In progress', 'In progress'],
    ['Blocked', 'Blocked'],
    ['Done', 'Done'],
    ['Cancelled', 'Cancelled'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: ['Source order (default)', 'Alphabetical order'],
    columns: [
      {
        type: 'autocomplete',
        source: this.statuses,
        strict: false,
      },
      {
        type: 'autocomplete',
        source: this.statuses,
        strict: false,
        // sort suggestions alphabetically instead of using the `source` order
        sortByRelevance: false,
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
