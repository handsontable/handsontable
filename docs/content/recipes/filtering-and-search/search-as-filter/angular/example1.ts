/* file: app.component.ts */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

type SearchResult = { row: number; col: number; data: unknown };

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

const debounce = (callback: () => void, delay = 120) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-search-as-filter',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <label for="search-filter-input">Filter rows</label>
        <input #searchInput id="search-filter-input" type="search" (input)="filterRows()" />
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  @ViewChild('searchInput') readonly searchInput!: ElementRef<HTMLInputElement>;

  readonly data = data;

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['Name', 'Role', 'Team', 'Location'],
    height: 'auto',
    search: true,
    hiddenRows: {
      copyPasteEnabled: false,
    },
  };

  readonly filterRows = debounce(() => {
    const hot = this.hotTable.hotInstance;
    const searchInput = this.searchInput.nativeElement;

    if (!hot) {
      return;
    }

    const results = hot.getPlugin('search').query(searchInput.value) as SearchResult[];
    const matchingRows = new Set(results.map(result => result.row));

    const hiddenRows = hot.getPlugin('hiddenRows');
    const rowsToHide: number[] = [];

    if (searchInput.value !== '') {
      for (let row = 0; row < hot.countRows(); row += 1) {
        if (!matchingRows.has(row)) {
          rowsToHide.push(row);
        }
      }
    }

    hot.batch(() => {
      hiddenRows.showRows(hiddenRows.getHiddenRows().filter(row => row !== null));
      hiddenRows.hideRows(rowsToHide);
      hot.render();
    });
  });
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
        // license: 'your-license-key', get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
