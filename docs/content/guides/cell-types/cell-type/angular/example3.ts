/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type { CellMeta } from 'handsontable/settings';

const projectMembers = [
  ['Ana García', 'Product Manager'],
  ['James Okafor', 'Senior Engineer'],
  ['Li Wei', 'UX Designer'],
];

const valueCellMeta: CellMeta[] = [
  { type: 'dropdown', source: ['Planning', 'In progress', 'Blocked'] },
  {
    type: 'numeric',
    locale: 'en-US',
    numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
  {
    type: 'intl-date',
    locale: 'en-US',
    dateFormat: { year: 'numeric', month: 'short', day: 'numeric' },
  },
  { type: 'checkbox' },
  { type: 'text' },
  {
    type: 'handsontable',
    handsontable: {
      colHeaders: ['Name', 'Role'],
      autoColumnSize: true,
      data: projectMembers,
      getValue() {
        const selection = this.getSelectedLast();

        return this.getSourceDataAtCell(Math.max(selection?.[0] ?? 0, 0), 0);
      },
    },
  },
  { type: 'password' },
];

@Component({
  selector: 'example3-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [data]="data" [settings]="gridSettings"></hot-table>`,
})
export class AppComponent {
  readonly data = [
    ['Status', 'In progress'],
    ['Budget', 250000],
    ['Due date', '2026-09-30'],
    ['Approved', true],
    ['Project name', 'Website redesign'],
    ['Owner', 'Ana García'],
    ['Access code', 'release-2026'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Setting', 'Value'],
    columns: [{ readOnly: true }, {}],
    cells: (row: number, col: number) => (col === 1 ? (valueCellMeta[row] ?? {}) : {}),
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

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
/* end-file */
