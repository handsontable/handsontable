import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  pagination: true,
});
const hot2 = new Handsontable(document.createElement('div'), {
  pagination: {
    pageSize: 10,
    pageSizeList: [5, 10, 20, 50, 100],
    initialPage: 1,
    autoPageSize: false,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
  },
  beforePageChange(oldPage, newPage) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;

    return true;
  },
  afterPageChange(oldPage, newPage) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;
  },
  beforePageSizeChange(oldPageSize, newPageSize) {
    const _oldPageSize: number = oldPageSize;
    const _newPageSize: number = newPageSize;

    return true;
  },
  afterPageSizeChange(oldPageSize, newPageSize) {
    const _oldPageSize: number = oldPageSize;
    const _newPageSize: number = newPageSize;
  },
  afterPageSizeVisibilityChange(isVisible) {
    const _isVisible: boolean = isVisible;
  },
  afterPageCounterVisibilityChange(isVisible) {
    const _isVisible: boolean = isVisible;
  },
  afterPageNavigationVisibilityChange(isVisible) {
    const _isVisible: boolean = isVisible;
  },
});
const plugin = hot.getPlugin('pagination');

const paginationData: {
  currentPage: number,
  totalPages: number,
  pageSize: number,
  pageSizeList: number[],
  numberOfRenderedRows: number,
  firstVisibleRow: number;
  lastVisibleRow: number;
} = plugin.getPaginationData();
const hasPreviousPage: boolean = plugin.hasPreviousPage();
const hasNextPage: boolean = plugin.hasNextPage();
const data: any[] = plugin.getCurrentPageData();

plugin.setPage(2);
plugin.setPageSize(20);
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
