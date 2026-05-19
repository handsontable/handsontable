/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { getRenderer } from 'handsontable/renderers';

const colHeaders = ['Name', 'Department', 'Role', 'Salary', 'Start Date'];

const data = [
  { name: 'Ana García',    department: 'Engineering',  role: 'Senior Engineer',    salary: 95000,  startDate: '2019-03-12' },
  { name: 'James Okafor',  department: 'Product',      role: 'Product Manager',    salary: 105000, startDate: '2020-07-01' },
  { name: 'Li Wei',        department: 'Design',       role: 'UX Designer',        salary: 88000,  startDate: '2021-01-15' },
  { name: 'Priya Sharma',  department: 'Engineering',  role: 'Tech Lead',          salary: 120000, startDate: '2018-09-05' },
  { name: 'Carlos Mendez', department: 'HR',           role: 'HR Specialist',      salary: 72000,  startDate: '2022-02-20' },
  { name: 'Sarah Chen',    department: 'Finance',      role: 'Financial Analyst',  salary: 91000,  startDate: '2020-11-30' },
  { name: 'Omar Hassan',   department: 'Engineering',  role: 'Backend Engineer',   salary: 98000,  startDate: '2021-06-14' },
  { name: 'Emma Wilson',   department: 'Marketing',    role: 'Marketing Lead',     salary: 85000,  startDate: '2019-08-22' },
];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-aria-grid',
  template: `
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly data = data;

  readonly gridSettings: GridSettings = {
    colHeaders,
    rowHeaders: true,
    height: 'auto',
    width: '100%',

    // Enable ARIA role attributes on grid, row, and cell DOM elements.
    ariaTags: true,

    // Tab moves focus to the next row (same column) instead of the next cell.
    tabMoves: { row: 1, col: 0 },

    // Enter confirms the edit and moves to the next row.
    enterMoves: { row: 1, col: 0 },

    // Prevent wrap-around navigation, which disorients screen reader users.
    autoWrapRow: false,
    autoWrapCol: false,

    // Enable column sorting so aria-sort on headers is meaningful.
    columnSorting: true,

    columns: [
      { data: 'name' },
      { data: 'department' },
      { data: 'role' },
      { data: 'salary' },
      { data: 'startDate' },
    ],

    // Custom renderer that sets aria-label to "Column Name: cell value" on every cell.
    cells() {
      return {
        renderer(hotInstance: Handsontable, TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: Handsontable.CellValue, cellProperties: Handsontable.CellProperties) {
          getRenderer('text')(hotInstance, TD, row, col, prop, value, cellProperties);
          TD.setAttribute('aria-label', `${colHeaders[col]}: ${value ?? 'empty'}`);
        },
      };
    },

    afterGetColHeader(col: number, TH: HTMLTableCellElement) {
      // Set the initial aria-sort state. The columnSorting plugin updates this
      // attribute automatically when the user sorts a column.
      if (!TH.hasAttribute('aria-sort')) {
        TH.setAttribute('aria-sort', 'none');
      }
    },
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
