/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      [settings]="hotSettings" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {

  readonly hotData = [
    ['Ana García',     'Engineering', 'Senior Engineer',  95000, '2026-03-14'],
    ['James Okafor',   'Marketing',   'Product Manager',  88000, '2026-07-01'],
    ['Li Wei',         'Engineering', 'Frontend Dev',     82000, '2026-01-10'],
    ['Maria Santos',   'HR',          'HR Specialist',    71000, '2026-11-20'],
    ['David Kim',      'Engineering', 'Backend Dev',      85000, '2026-08-05'],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',      68000, '2026-02-14'],
    ['Ahmed Hassan',   'Finance',     'Controller',       92000, '2026-06-30'],
    ['Sara Johansson', 'Engineering', 'QA Engineer',      78000, '2026-09-12'],
    ['Carlos Mendez',  'Sales',       'Account Manager',  74000, '2026-04-25'],
  ];

  readonly hotSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
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
