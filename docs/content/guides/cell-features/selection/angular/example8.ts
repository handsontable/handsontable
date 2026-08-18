/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example8-selection',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['Ana García',     'Engineering', 'Senior Engineer',  95000, 'Madrid',      12],
    ['James Okafor',   'Marketing',   'Product Manager',  88000, 'Lagos',        8],
    ['Li Wei',         'Engineering', 'Frontend Dev',     82000, 'Shanghai',     5],
    ['Maria Santos',   'HR',          'HR Specialist',    71000, 'Lisbon',       3],
    ['David Kim',      'Engineering', 'Backend Dev',      85000, 'Seoul',        7],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',      68000, 'London',       2],
    ['Ahmed Hassan',   'Finance',     'Controller',       92000, 'Cairo',       10],
    ['Sara Johansson', 'Engineering', 'QA Engineer',      78000, 'Stockholm',    6],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Name', 'Department', 'Role', 'Salary', 'City', 'Tenure'],
    rowHeaders: true,
    width: 'auto',
    height: 'auto',
    moveCells: true,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  ngAfterViewInit(): void {
    // Pre-select an interior range so the move border is immediately discoverable.
    this.hotTable?.hotInstance?.selectCell(1, 1, 3, 3);
  }
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
