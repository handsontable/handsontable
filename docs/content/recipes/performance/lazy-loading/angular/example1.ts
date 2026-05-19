/* file: app.component.ts */
import { Component, OnInit, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

/* start:skip-in-preview */
type TaskRow = {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
};

const INITIAL_DATA: TaskRow[] = [
  { id: 1, title: 'Set up CI pipeline', completed: false, userId: 3 },
  { id: 2, title: 'Write unit tests for auth module', completed: true, userId: 1 },
  { id: 3, title: 'Review pull request #42', completed: false, userId: 2 },
  { id: 4, title: 'Update API documentation', completed: true, userId: 1 },
  { id: 5, title: 'Fix login redirect bug', completed: true, userId: 4 },
  { id: 6, title: 'Deploy staging environment', completed: false, userId: 3 },
  { id: 7, title: 'Implement dark mode toggle', completed: false, userId: 2 },
  { id: 8, title: 'Optimize database queries', completed: true, userId: 5 },
  { id: 9, title: 'Add error boundary components', completed: false, userId: 1 },
  { id: 10, title: 'Migrate to TypeScript', completed: false, userId: 2 },
  { id: 11, title: 'Set up monitoring alerts', completed: true, userId: 3 },
  { id: 12, title: 'Refactor form validation logic', completed: false, userId: 4 },
  { id: 13, title: 'Add keyboard shortcuts guide', completed: true, userId: 1 },
  { id: 14, title: 'Review security audit findings', completed: false, userId: 5 },
  { id: 15, title: 'Create onboarding checklist', completed: true, userId: 2 },
  { id: 16, title: 'Update dependencies to latest', completed: false, userId: 3 },
  { id: 17, title: 'Write release notes for v2.0', completed: false, userId: 1 },
  { id: 18, title: 'Set up feature flags service', completed: true, userId: 4 },
  { id: 19, title: 'Implement CSV export feature', completed: false, userId: 2 },
  { id: 20, title: 'Add pagination to task list', completed: true, userId: 5 },
];
/* end:skip-in-preview */

const LOAD_THRESHOLD = 5;
const PAGE_SIZE = 20;
// JSONPlaceholder has 200 todos total (10 pages of 20)
const TOTAL_PAGES = 10;

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-lazy-loading',
  styles: [`
    .status-line {
      padding: 8px;
      text-align: center;
      color: #666;
      font-size: 13px;
    }
  `],
  template: `
    <hot-table [data]="loadedData" [settings]="gridSettings"></hot-table>
    <div class="status-line">{{ statusText }}</div>
  `,
})
export class AppComponent implements OnInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  loadedData: TaskRow[] = [...INITIAL_DATA];
  // Always visible -- no blinking; text only changes at end-of-data or on error
  statusText = 'Scroll table to load more records';

  private currentPage = 1;
  private isLoading = false;
  private hasMore = true;

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task Title', 'Status', 'Assignee'],
    columns: [
      { data: 'title', type: 'text', width: 400 },
      { data: 'completed', type: 'checkbox', width: 80, className: 'htCenter' },
      { data: 'userId', type: 'numeric', width: 100 },
    ],
    rowHeaders: true,
    height: 400,
    width: '100%',
    stretchH: 'all',
    autoWrapRow: true,
    loading: true,
    afterScrollVertically: () => {
      const hot = this.hotTable?.hotInstance;

      if (!hot) {
        return;
      }

      const lastVisibleRow = (hot as any).view.getLastFullyVisibleRow();
      const totalRows = hot.countRows();

      if (lastVisibleRow >= 0 && lastVisibleRow >= totalRows - LOAD_THRESHOLD) {
        this.fetchNextPage();
      }
    },
  };

  ngOnInit(): void {
    this.fetchNextPage();
  }

  private async fetchNextPage(): Promise<void> {
    if (this.isLoading || !this.hasMore) {
      return;
    }

    this.isLoading = true;
    this.hotTable?.hotInstance?.getPlugin('loading').show();

    try {
      const nextPage = this.currentPage + 1;
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos?_page=${nextPage}&_limit=${PAGE_SIZE}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const newRows: TaskRow[] = await response.json();

      if (newRows.length === 0 || nextPage >= TOTAL_PAGES) {
        this.hasMore = false;
        this.statusText = 'All tasks loaded.';
      } else {
        this.currentPage = nextPage;
        // Push rows in a loop to avoid stack overflow with large arrays
        newRows.forEach((row) => this.loadedData.push(row));
        // `updateData()` appends rows without resetting scroll position
        this.hotTable?.hotInstance?.updateData(this.loadedData);
      }
    } catch {
      this.statusText = 'Failed to load more tasks. Scroll down to retry.';
      this.isLoading = false;
      this.hotTable?.hotInstance?.getPlugin('loading').hide();

      return;
    }

    this.isLoading = false;
    this.hotTable?.hotInstance?.getPlugin('loading').hide();
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
