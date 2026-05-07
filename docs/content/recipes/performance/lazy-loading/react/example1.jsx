import { useRef, useState, useCallback, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
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

const LOAD_THRESHOLD = 5;
const PAGE_SIZE = 20;
// JSONPlaceholder has 200 todos total (10 pages of 20)
const TOTAL_PAGES = 10;

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const currentPage = useRef(1);
  const isLoading = useRef(false);
  const hasMore = useRef(true);
  const loadedData = useRef([...INITIAL_DATA]);
  // Always visible -- no blinking; text only changes at end-of-data or on error
  const [statusText, setStatusText] = useState('Scroll table to load more records');

  const fetchNextPage = useCallback(async () => {
    if (isLoading.current || !hasMore.current) {
      return;
    }

    isLoading.current = true;
    hotRef.current?.hotInstance?.getPlugin('loading').show();

    try {
      const nextPage = currentPage.current + 1;
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos?_page=${nextPage}&_limit=${PAGE_SIZE}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const newRows = await response.json();

      if (newRows.length === 0 || nextPage >= TOTAL_PAGES) {
        hasMore.current = false;
        setStatusText('All tasks loaded.');
      } else {
        currentPage.current = nextPage;
        loadedData.current = [...loadedData.current, ...newRows];
        // `updateData()` appends rows without resetting scroll position
        hotRef.current?.hotInstance?.updateData(loadedData.current);
      }
    } catch {
      setStatusText('Failed to load more tasks. Scroll down to retry.');
      isLoading.current = false;
      hotRef.current?.hotInstance?.getPlugin('loading').hide();

      return;
    }

    isLoading.current = false;
    hotRef.current?.hotInstance?.getPlugin('loading').hide();
  }, []);

  useEffect(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <>
      <HotTable
        ref={hotRef}
        data={INITIAL_DATA}
        colHeaders={['Task Title', 'Status', 'Assignee']}
        columns={[
          { data: 'title', type: 'text', width: 400 },
          { data: 'completed', type: 'checkbox', width: 80, className: 'htCenter' },
          { data: 'userId', type: 'numeric', width: 100 },
        ]}
        rowHeaders={true}
        height={400}
        width="100%"
        stretchH="all"
        autoWrapRow={true}
        loading={true}
        afterScrollVertically={function () {
          const lastVisibleRow = this.view.getLastFullyVisibleRow();
          const totalRows = this.countRows();

          if (lastVisibleRow >= 0 && lastVisibleRow >= totalRows - LOAD_THRESHOLD) {
            fetchNextPage();
          }
        }}
        licenseKey="non-commercial-and-evaluation"
      />
      <div style={{ padding: '8px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
        {statusText}
      </div>
    </>
  );
};

export default ExampleComponent;
