/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const jobTitles = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Designer',
  'Data Analyst',
  'Data Scientist',
  'Marketing Specialist',
  'Account Executive',
  'Customer Success Manager',
  'Finance Analyst',
  'Recruiter',
  'Office Manager',
];

@Component({
  selector: 'example5-dropdown-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['Ana García', 'Senior Software Engineer', 'Senior Software Engineer'],
    ['James Okafor', 'Product Manager', 'Product Manager'],
    ['Li Wei', 'Data Scientist', 'Data Scientist'],
    ['Sofia Rossi', 'Account Executive', 'Account Executive'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['Employee', 'Job title (default)', 'Job title (compact)'],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {},
      {
        type: 'dropdown',
        source: jobTitles,
      },
      {
        type: 'dropdown',
        source: jobTitles,
        // show 3 options at a time, then scroll
        visibleRows: 3,
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
