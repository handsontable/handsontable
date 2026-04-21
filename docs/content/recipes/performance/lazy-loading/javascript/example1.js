import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const INITIAL_DATA = [
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

// Pagination state
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let loadedData = [...INITIAL_DATA];

// Number of rows from the bottom that triggers the next page fetch
const LOAD_THRESHOLD = 5;
const PAGE_SIZE = 20;
// JSONPlaceholder has 200 todos total (10 pages of 20)
const TOTAL_PAGES = 10;

const container = document.querySelector('#example1');

// Persistent status line below the grid -- always visible, never blinks
const statusEl = document.createElement('div');

statusEl.style.cssText = 'padding:8px; text-align:center; color:#666; font-size:13px;';
statusEl.textContent = 'Scroll table to load more records';
container.insertAdjacentElement('afterend', statusEl);

/**
 * Fetches the next page of tasks from the JSONPlaceholder API and appends
 * the rows to the grid using `updateData()`. This method preserves scroll
 * position and column state -- unlike `loadData()`, which resets both.
 */
async function fetchNextPage() {
  if (isLoading || !hasMore) {
    return;
  }

  isLoading = true;
  hot.getPlugin('loading').show();

  try {
    const nextPage = currentPage + 1;
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/todos?_page=${nextPage}&_limit=${PAGE_SIZE}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const newRows = await response.json();

    if (newRows.length === 0 || nextPage >= TOTAL_PAGES) {
      hasMore = false;
      statusEl.textContent = 'All tasks loaded.';
    } else {
      currentPage = nextPage;
      loadedData = [...loadedData, ...newRows];
      // `updateData()` replaces the data source without resetting scroll
      // position, selection, or column configuration.
      hot.updateData(loadedData);
    }
  } catch {
    statusEl.textContent = 'Failed to load more tasks. Scroll down to retry.';
    isLoading = false;
    hot.getPlugin('loading').hide();

    return;
  }

  isLoading = false;
  hot.getPlugin('loading').hide();
}

const hot = new Handsontable(container, {
  data: loadedData,
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
  afterScrollVertically() {
    // `lastVisibleRow` is the visual index of the last fully visible row.
    const lastVisibleRow = this.view.getLastFullyVisibleRow();
    const totalRows = this.countRows();

    // Trigger a fetch when the user is within LOAD_THRESHOLD rows of the
    // last loaded row. Using `>= 0` guards against -1 when no rows are
    // visible yet (e.g., during initial render).
    if (lastVisibleRow >= 0 && lastVisibleRow >= totalRows - LOAD_THRESHOLD) {
      fetchNextPage();
    }
  },
  licenseKey: 'non-commercial-and-evaluation',
});

// Load the first remote page on initialization. The grid already shows
// INITIAL_DATA; this call replaces it with server data so the example
// works even without a real backend when the network is unavailable.
fetchNextPage();
