/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const requiredItems = ['Passport', 'Tickets', 'Wallet', 'Phone', 'Keys'];
const optionalExtras = ['Snacks', 'Book', 'Camera', 'Umbrella', 'First aid kit'];
const interests = ['Art', 'History', 'Nature', 'Food', 'Shopping'];

const sortAlphabetically = (entries: string[]) =>
  [...entries].sort((a, b) => String(a).localeCompare(String(b)));

const data = [
  [['Passport', 'Phone'], ['Snacks', 'Book'], ['Nature']],
  [['Tickets', 'Wallet'], ['Camera'], []],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
];

@Component({
  selector: 'example3-multiselect-cell-type',
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
        type: 'multiselect',
        source: requiredItems,
        title: 'Required items',
        allowEmpty: false,
      },
      {
        type: 'multiselect',
        source: optionalExtras,
        title: 'Optional extras',
        placeholder: 'Select up to 3',
        maxSelections: 3,
        visibleRows: 4,
        searchInput: false,
      },
      {
        type: 'multiselect',
        source: interests,
        title: 'Interests',
        placeholder: 'Select interests',
        sourceSortFunction: sortAlphabetically,
        filteringCaseSensitive: true,
      },
    ],
    preventOverflow: 'horizontal',
    colWidths: 200,
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
