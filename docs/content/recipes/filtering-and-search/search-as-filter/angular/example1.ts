/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

/* start:skip-in-preview */
const data = [
  ['Hannah Schmidt', 'Product manager', 'Platform', 'Berlin'],
  ['Kenji Watanabe', 'Backend engineer', 'Platform', 'Tokyo'],
  ['Sofia Rossi', 'UX designer', 'Design', 'Milan'],
  ['Mateo Fernandez', 'Account executive', 'Sales', 'Madrid'],
  ['Amara Okafor', 'Data analyst', 'Insights', 'Lagos'],
  ['Lukas Novak', 'Frontend engineer', 'Web', 'Prague'],
  ['Priya Nair', 'QA engineer', 'Web', 'Bengaluru'],
  ['Elias Lindqvist', 'Support specialist', 'Support', 'Stockholm'],
  ['Zofia Kowalska', 'Frontend engineer', 'Web', 'Warsaw'],
  ['Daniel Becker', 'Sales engineer', 'Sales', 'Berlin'],
  ['Camille Laurent', 'Content designer', 'Design', 'Paris'],
  ['Omar Haddad', 'Site reliability engineer', 'Platform', 'Dubai'],
  ['Isabela Costa', 'Data engineer', 'Insights', 'Lisbon'],
  ['Thomas Wright', 'Support specialist', 'Support', 'Toronto'],
  ['Mei Lin Chen', 'Product designer', 'Design', 'Singapore'],
  ['Jonas Meyer', 'Account manager', 'Sales', 'Vienna'],
];
/* end:skip-in-preview */

type SearchResult = { row: number; col: number; data: unknown };

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-search-as-filter',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <label for="search-filter-input">Filter rows</label>
        <input id="search-filter-input" type="search" (input)="filterRows($event)" />
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['Name', 'Role', 'Team', 'Location'],
    height: 'auto',
    search: true,
    hiddenRows: true,
  };

  filterRows(event: Event): void {
    const hot = this.hotTable.hotInstance;

    if (!hot) {
      return;
    }

    const query = (event.target as HTMLInputElement).value;
    const results = hot.getPlugin('search').query(query) as SearchResult[];
    const matchingRows = new Set(results.map(({ row }) => row));
    const hiddenRowsPlugin = hot.getPlugin('hiddenRows');
    const rowsToHide: number[] = [];

    if (query !== '') {
      for (let row = 0; row < hot.countRows(); row += 1) {
        if (!matchingRows.has(row)) {
          rowsToHide.push(row);
        }
      }
    }

    hiddenRowsPlugin.showRows(hiddenRowsPlugin.getHiddenRows());
    hiddenRowsPlugin.hideRows(rowsToHide);
    hot.render();
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
