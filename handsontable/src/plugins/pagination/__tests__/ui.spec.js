describe('Pagination UI', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function isTopBorderVisible() {
    // The first after-grid item never draws a top border (the grid's own bottom border divides them).
    // The pagination is that first item in these specs, so its top border is always 0.
    return getComputedStyle(getPaginationContainerElement()).borderTopWidth !== '0px';
  }

  it('should correctly calculate the width of the pagination container (table has defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 20),
      width: 500,
      height: 300,
      pagination: true,
    });

    await waitForNextAnimationFrames(2);

    expect(getPaginationContainerElement().offsetWidth).toBe(500);
  });

  it('should set rootAfterGridElement width after render when pagination is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(15, 20),
      width: 500,
      height: 300,
      pagination: true,
    });

    await waitForNextAnimationFrames(2);

    expect(hot().rootAfterGridElement.style.width).toBe('500px');
  });

  it('should fill the after-grid slot width when the table has no defined size', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        pageSize: 9,
      },
    });

    await waitForNextAnimationFrames(2);

    // The pagination no longer sets its own width - it fills the after-grid slot.
    expect(getPaginationContainerElement().offsetWidth).toBe(hot().rootAfterGridElement.offsetWidth);
  });

  it('should hide the pagination container element when all sections are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(11, 10),
      pagination: true,
    });

    expect(getPaginationContainerElement()).toBeVisible();

    await updateSettings({
      pagination: {
        showPageSize: false,
      }
    });

    expect(getPaginationContainerElement()).toBeVisible();

    await updateSettings({
      pagination: {
        showPageSize: false,
        showCounter: false,
      }
    });

    expect(getPaginationContainerElement()).toBeVisible();

    await updateSettings({
      pagination: {
        showPageSize: false,
        showCounter: false,
        showNavigation: false,
      }
    });

    expect(getPaginationContainerElement()).not.toBeVisible();

    await updateSettings({
      pagination: {
        showPageSize: false,
        showCounter: true,
        showNavigation: false,
      }
    });

    expect(getPaginationContainerElement()).toBeVisible();
  });

  it('should add `htPagination` CSS class to the root table element when pagination container is visible', async() => {
    handsontable({
      data: createSpreadsheetData(11, 10),
      pagination: {
        showPageSize: true,
        showCounter: false,
        showNavigation: true,
      },
    });

    expect(hot().rootElement).toHaveClass('htPagination');
  });

  it('should remove `htPagination` CSS class from the root table element when pagination container is not visible', async() => {
    handsontable({
      data: createSpreadsheetData(11, 10),
      pagination: {
        showPageSize: false,
        showCounter: false,
        showNavigation: false,
      },
    });

    expect(hot().rootElement).not.toHaveClass('htPagination');
  });

  it('should never draw the top border of the pagination container (it is the first after-grid item)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      width: 600,
      height: 250,
      pagination: true,
    });

    // Workspace taller than content, scrollable content, scrolled to the bottom, and reflows -
    // the first after-grid item's top border is always removed regardless.
    expect(isTopBorderVisible()).toBe(false);

    await scrollViewportVertically(10000);

    expect(isTopBorderVisible()).toBe(false);

    await updateSettings({ height: 400 });

    expect(isTopBorderVisible()).toBe(false);

    getPlugin('pagination').nextPage();

    expect(isTopBorderVisible()).toBe(false);
  });

  it('should keep the table height stable when the page is changed', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      pagination: true,
      autoRowSize: true,
    });

    const height = (getDefaultRowHeight() * 10) + 1;

    expect(hot().rootElement.offsetHeight).toBe(height);

    getPlugin('pagination').setPage(2);

    expect(hot().rootElement.offsetHeight).toBe(height);

    getPlugin('pagination').setPage(3);

    expect(hot().rootElement.offsetHeight).toBe(height);
  });

  it('should adjust the table height to fit the pagination container in declared height (all sections are visible)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 800,
      height: 400,
      pagination: true,
    });

    const paginationHeight = spec().$container.find('.ht-pagination')[0].offsetHeight;

    expect(tableView().getViewportHeight()).toBe(400 - paginationHeight);
  });

  it('should adjust the table height to fit the pagination container in declared height (all sections are hidden)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 500,
      height: 400,
      pagination: {
        showPageSize: false,
        showCounter: false,
        showNavigation: false,
      },
    });

    expect(tableView().getViewportHeight()).toBe(400);
  });

  it('should focus the previous button when the next button is disabled while navigating to the next page', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 500,
      height: 400,
      pagination: true,
    });

    const plugin = getPlugin('pagination');
    const prevButton = getPaginationContainerElement().querySelector('.ht-page-prev');
    const nextButton = getPaginationContainerElement().querySelector('.ht-page-next');
    const lastButton = getPaginationContainerElement().querySelector('.ht-page-last');

    nextButton.focus();

    plugin.lastPage();

    expect(document.activeElement).toBe(prevButton);

    plugin.firstPage();
    lastButton.focus();

    plugin.lastPage();

    expect(document.activeElement).toBe(prevButton);
  });

  it('should focus the next button when the previous button is disabled while navigating to the previous page', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 500,
      height: 400,
      pagination: true,
    });

    const plugin = getPlugin('pagination');
    const firstButton = getPaginationContainerElement().querySelector('.ht-page-first');
    const prevButton = getPaginationContainerElement().querySelector('.ht-page-prev');
    const nextButton = getPaginationContainerElement().querySelector('.ht-page-next');

    plugin.lastPage();
    prevButton.focus();

    plugin.firstPage();

    expect(document.activeElement).toBe(nextButton);

    plugin.lastPage();
    firstButton.focus();

    plugin.firstPage();

    expect(document.activeElement).toBe(nextButton);
  });
});
