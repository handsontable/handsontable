/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const departments = [
  'Engineering and Platform Infrastructure',
  'Marketing and Brand Communications',
  'Financial Planning and Analysis',
  'People Operations and Talent Acquisition',
  'Customer Success and Enterprise Accounts',
];

@Component({
  selector: 'example4-dropdown-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['Ana García', departments[0], departments[0]],
    ['James Okafor', departments[1], departments[1]],
    ['Li Wei', departments[2], departments[2]],
    ['Sofia Rossi', departments[3], departments[3]],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['Employee', 'Department (default)', 'Department (full width)'],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {},
      {
        type: 'dropdown',
        source: departments,
        width: 140,
        // trim the list to the cell's width (default)
        trimDropdown: true,
      },
      {
        type: 'dropdown',
        source: departments,
        width: 140,
        // expand the list to fit its longest option
        trimDropdown: false,
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
