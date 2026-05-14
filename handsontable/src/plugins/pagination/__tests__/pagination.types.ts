import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  pagination: true,
});
const hot2 = new Handsontable(document.createElement('div'), {
  pagination: {
    pageSize: 'auto',
    pageSizeList: ['auto', 10, 20, 50, 100],
  },
});
const hot3 = new Handsontable(document.createElement('div'), {
  pagination: {
    pageSize: 10,
    pageSizeList: [5, 10, 20, 50, 100],
    initialPage: 1,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
    uiContainer: document.createElement('div'),
  },
  beforePageChange(oldPage: number, newPage: number) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;

    return true;
  },
  afterPageChange(oldPage: number, newPage: number) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;
  },
  beforePageSizeChange(oldPageSize: number | 'auto', newPageSize: number | 'auto') {
    const _oldPageSize: number | 'auto' = oldPageSize;
    const _newPageSize: number | 'auto' = newPageSize;

    return true;
  },
  afterPageSizeChange(oldPageSize: number | 'auto', newPageSize: number | 'auto') {
    const _oldPageSize: number | 'auto' = oldPageSize;
    const _newPageSize: number | 'auto' = newPageSize;
  },
  afterPageSizeVisibilityChange(isVisible: boolean) {
    const _isVisible: boolean = isVisible;
  },
  afterPageCounterVisibilityChange(isVisible: boolean) {
    const _isVisible: boolean = isVisible;
  },
  afterPageNavigationVisibilityChange(isVisible: boolean) {
    const _isVisible: boolean = isVisible;
  },
});
const plugin = hot.getPlugin('pagination');

const paginationData = plugin.getPaginationData();
const _currentPage: number = paginationData.currentPage;
const _totalPages: number = paginationData.totalPages;
const _autoPageSize: boolean = paginationData.autoPageSize;
const _numberOfRenderedRows: number = paginationData.numberOfRenderedRows;
const currentPageIndex: number = plugin.getCurrentPage();
const currentPageSize: number | 'auto' = plugin.getCurrentPageSize();
const hasPreviousPage: boolean = plugin.hasPreviousPage();
const hasNextPage: boolean = plugin.hasNextPage();
const data: unknown[] = plugin.getCurrentPageData();

plugin.setPage(2);
plugin.resetPage();
plugin.setPageSize(20);
plugin.setPageSize('auto');
plugin.resetPageSize();
plugin.resetPagination();
plugin.nextPage();
plugin.prevPage();
plugin.firstPage();
plugin.lastPage();
plugin.showPageSizeSection();
plugin.hidePageSizeSection();
plugin.showPageCounterSection();
plugin.hidePageCounterSection();
plugin.showPageNavigationSection();
plugin.hidePageNavigationSection();
