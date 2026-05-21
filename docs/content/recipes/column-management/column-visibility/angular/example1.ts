/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

type ColumnConfig = {
  data: string;
  title: string;
  type: string;
  width: number;
  locale?: string;
  numericFormat?: Intl.NumberFormatOptions;
  dateFormat?: Intl.DateTimeFormatOptions;
  source?: string[];
};

const allColumns: ColumnConfig[] = [
  { data: 'name', title: 'Name', type: 'text', width: 140 },
  { data: 'department', title: 'Department', type: 'text', width: 120 },
  { data: 'role', title: 'Role', type: 'text', width: 150 },
  {
    data: 'salary',
    title: 'Salary',
    type: 'numeric',
    locale: 'en-US',
    numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    width: 110,
  },
  { data: 'startDate', title: 'Start Date', type: 'intl-date', locale: 'en-CA', dateFormat: { dateStyle: 'short' }, width: 120 },
  { data: 'location', title: 'Location', type: 'text', width: 120 },
  {
    data: 'status',
    title: 'Status',
    type: 'dropdown',
    source: ['Active', 'On Leave', 'Inactive'],
    width: 120,
  },
];

const data = [
  { name: 'Alice Johnson', department: 'Engineering', role: 'Senior Engineer',    salary: 95000,  startDate: '2019-03-12', location: 'New York',      status: 'Active' },
  { name: 'Bob Martinez',  department: 'Marketing',   role: 'Marketing Manager',  salary: 78000,  startDate: '2020-07-01', location: 'Chicago',       status: 'Active' },
  { name: 'Carol Lee',     department: 'Engineering', role: 'Tech Lead',          salary: 115000, startDate: '2017-11-15', location: 'San Francisco', status: 'Active' },
  { name: 'David Kim',     department: 'HR',          role: 'HR Specialist',      salary: 65000,  startDate: '2021-02-28', location: 'Austin',        status: 'On Leave' },
  { name: 'Eva Novak',     department: 'Finance',     role: 'Financial Analyst',  salary: 82000,  startDate: '2018-09-03', location: 'New York',      status: 'Active' },
  { name: 'Frank Chen',    department: 'Engineering', role: 'Junior Engineer',    salary: 72000,  startDate: '2022-05-16', location: 'Seattle',       status: 'Active' },
  { name: 'Grace Okafor',  department: 'Sales',       role: 'Sales Executive',    salary: 70000,  startDate: '2020-01-20', location: 'Dallas',        status: 'Active' },
  { name: 'Henry Walsh',   department: 'Finance',     role: 'Finance Director',   salary: 130000, startDate: '2015-06-10', location: 'Chicago',       status: 'Active' },
];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-column-visibility',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        @for (col of allColumns; track col.data; let i = $index) {
          <label>
            <input
              type="checkbox"
              [checked]="visibleIndices.has(i)"
              [disabled]="visibleIndices.size === 1 && visibleIndices.has(i)"
              (change)="toggleColumn(i, $event)"
            />
            {{ col.title }}
          </label>
        }
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;
  readonly allColumns = allColumns;

  // Track which column indices are currently visible. Start with all visible.
  visibleIndices = new Set(allColumns.map((_, i) => i));

  gridSettings: GridSettings = {
    columns: this.getVisibleColumns(),
    colHeaders: this.getVisibleHeaders(),
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
  };

  toggleColumn(index: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (!checked) {
      // Prevent hiding the last visible column.
      if (this.visibleIndices.size === 1) {
        (event.target as HTMLInputElement).checked = true;
        return;
      }
      this.visibleIndices.delete(index);
    } else {
      this.visibleIndices.add(index);
    }

    // Reassign to trigger Angular change detection on the template bindings.
    this.visibleIndices = new Set(this.visibleIndices);

    this.hotTable?.hotInstance?.updateSettings({
      columns: this.getVisibleColumns(),
      colHeaders: this.getVisibleHeaders(),
    });
  }

  private getVisibleColumns(): ColumnConfig[] {
    return allColumns.filter((_, i) => this.visibleIndices.has(i));
  }

  private getVisibleHeaders(): string[] {
    return allColumns.filter((_, i) => this.visibleIndices.has(i)).map(col => col.title);
  }
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
