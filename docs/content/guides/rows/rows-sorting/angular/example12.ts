/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

// The first row holds a target and the last one a total. Both are frozen, so they stay in
// view while you scroll.
const getData = () => [
  ['Target', 30000, 225],
  ['North', 42300, 318],
  ['South', 18750, 142],
  ['East', 27900, 205],
  ['West', 35100, 264],
  ['Total', 124050, 929],
];

// Builds one grid's settings. Only `sortFixedRows` differs between the two grids.
const createSettings = (sortFixedRows: boolean): GridSettings => ({
  data: getData(),
  colHeaders: ['Region', 'Revenue', 'Orders'],
  columns: [
    { type: 'text' },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
      },
    },
    { type: 'numeric' },
  ],
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  columnSorting: {
    // `false` is the default: the frozen rows keep their place whatever you sort by.
    sortFixedRows,
    // Both grids start sorted by revenue, highest first.
    initialConfig: { column: 1, sortOrder: 'desc' },
  },
  height: 'auto',
  stretchH: 'all',
});

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example12',
  template: `
    <h3 class="demo-preview">Default: the frozen rows keep their place</h3>
    <hot-table [settings]="defaultSettings"></hot-table>
    <h3 class="demo-preview">With <code>sortFixedRows: true</code>: the frozen rows are sorted too</h3>
    <hot-table [settings]="allRowsSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly defaultSettings = createSettings(false);
  readonly allRowsSettings = createSettings(true);
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
