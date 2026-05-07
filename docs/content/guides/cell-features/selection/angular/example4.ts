/* file: app.component.ts */
import { Component, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example4-selection',
  standalone: true,
  imports: [HotTableModule],
  styles: [`
    #example4 td.area { background-color: rgba(75, 137, 255, 0.2); }
    #example4 td.area.area-1 { background-color: rgba(75, 137, 255, 0.4); }
    #example4 td.area.area-2 { background-color: rgba(75, 137, 255, 0.6); }
  `],
  template: `<div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  readonly data = [
    ['Ana García',     'Engineering', 'Senior Engineer',  95000, 'Madrid',      'Spain',    'F', 12, '2026-03-14'],
    ['James Okafor',   'Marketing',   'Product Manager',  88000, 'Lagos',        'Nigeria',  'M',  8, '2026-07-01'],
    ['Li Wei',         'Engineering', 'Frontend Dev',     82000, 'Shanghai',     'China',    'M',  5, '2026-01-10'],
    ['Maria Santos',   'HR',          'HR Specialist',    71000, 'Lisbon',       'Portugal', 'F',  3, '2026-11-20'],
    ['David Kim',      'Engineering', 'Backend Dev',      85000, 'Seoul',        'Korea',    'M',  7, '2026-08-05'],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',      68000, 'London',       'UK',       'F',  2, '2026-02-14'],
  ];

  readonly gridSettings: GridSettings = {
    width: 'auto',
    height: 'auto',
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    outsideClickDeselects: false,
    selectionMode: 'multiple',
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
