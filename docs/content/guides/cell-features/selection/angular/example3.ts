/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-selection',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <button id="set-data-action" (click)="buttonClick()">
          Click to modify the selected cells
        </button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['Ana García',     'Engineering', 'Senior Engineer',  95000, 'Madrid',      'Spain',    'F', 12, '2026-03-14'],
    ['James Okafor',   'Marketing',   'Product Manager',  88000, 'Lagos',        'Nigeria',  'M',  8, '2026-07-01'],
    ['Li Wei',         'Engineering', 'Frontend Dev',     82000, 'Shanghai',     'China',    'M',  5, '2026-01-10'],
    ['Maria Santos',   'HR',          'HR Specialist',    71000, 'Lisbon',       'Portugal', 'F',  3, '2026-11-20'],
    ['David Kim',      'Engineering', 'Backend Dev',      85000, 'Seoul',        'Korea',    'M',  7, '2026-08-05'],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',      68000, 'London',       'UK',       'F',  2, '2026-02-14'],
    ['Ahmed Hassan',   'Finance',     'Controller',       92000, 'Cairo',        'Egypt',    'M', 10, '2026-06-30'],
    ['Sara Johansson', 'Engineering', 'QA Engineer',      78000, 'Stockholm',    'Sweden',   'F',  6, '2026-09-12'],
    ['Carlos Mendez',  'Sales',       'Account Manager',  74000, 'Mexico City',  'Mexico',   'M',  4, '2026-04-25'],
  ];

  readonly gridSettings: GridSettings = {
    width: 'auto',
    height: 'auto',
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    outsideClickDeselects: false,
    selectionMode: 'multiple', // 'single', 'range' or 'multiple',
    autoWrapRow: true,
    autoWrapCol: true
  };

  output = '';

  buttonClick(): void {
    const hot = this.hotTable?.hotInstance;
    const selected = hot?.getSelected() || [];

    hot?.suspendRender();

    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);

      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (
          let columnIndex = startCol;
          columnIndex <= endCol;
          columnIndex += 1
        ) {
          hot?.setDataAtCell(rowIndex, columnIndex, 'data changed');
          hot?.setCellMeta(rowIndex, columnIndex, 'className', 'c-red');
        }
      }
    }

    hot?.render();
    hot?.resumeRender();
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
