/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { rendererFactory } from 'handsontable/renderers';

type RowData = {
  id: number;
  title: string;
  owner: string;
  status: string;
};

const data: RowData[] = [
  { id: 101, title: 'Search API docs', owner: 'Alex', status: 'In progress' },
  { id: 102, title: 'Renderer refactor', owner: 'Mia', status: 'Review' },
  { id: 103, title: 'Fix keyboard shortcut', owner: 'Noah', status: 'Done' },
  { id: 104, title: 'Search UX tests', owner: 'Ava', status: 'In progress' },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let currentSearchTerm = '';

const highlightRenderer = rendererFactory(({ td, value, cellProperties }) => {
  const cellText = value === null || value === undefined ? '' : String(value);
  const query = currentSearchTerm.trim();

  if (!query || !cellProperties.isSearchResult) {
    td.textContent = cellText;

    return;
  }

  const splitter = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const highlighted = cellText
    .split(splitter)
    .map(fragment => (
      fragment.toLocaleLowerCase() === query.toLocaleLowerCase()
        ? `<mark>${escapeHtml(fragment)}</mark>`
        : escapeHtml(fragment)
    ))
    .join('');

  td.innerHTML = highlighted;
});

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-highlight-search-matches',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <input
          id="search_field"
          type="search"
          placeholder="Search tasks"
          (input)="onSearch($event)"
        />
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = data;

  readonly gridSettings: GridSettings = {
    colHeaders: ['ID', 'Title', 'Owner', 'Status'],
    rowHeaders: true,
    height: 'auto',
    search: true,
    columns: [
      { data: 'id', type: 'numeric' },
      { data: 'title', renderer: highlightRenderer },
      { data: 'owner', renderer: highlightRenderer },
      { data: 'status', renderer: highlightRenderer },
    ],
  };

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const hot = this.hotTable.hotInstance;

    if (!hot) {
      return;
    }

    currentSearchTerm = value;
    hot.getPlugin('search').query(value);
    hot.render();
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
