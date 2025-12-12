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
    const {
      borderTopColor,
    } = getComputedStyle(getPaginationContainerElement());

    if (!borderTopColor.startsWith('rgba')) {
      return true;
    }

    return borderTopColor.slice(borderTopColor.lastIndexOf(',') + 1, -1) > 0;
  }

  it('should correctly calculate the width of the pagination container (table has defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 20),
      width: 500,
      height: 300,
      pagination: true,
    });

    expect(getPaginationContainerElement().offsetWidth).toBe(500);
  });

  it('should correctly calculate the width of the pagination container (table has not defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        pageSize: 9,
      },
    });

    expect(getPaginationContainerElement().offsetWidth).toBe(500);
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

  it('should draw border-top of the pagination container when the workspace height is bigger than tables content height', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: 400,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(true);
  });

  it('should draw border-top of the pagination container when there is horizontal scroll', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      width: 500,
      height: 200,
      pagination: true,
    });

    await scrollViewportVertically(10000); // scroll to the most-bottom position

    expect(isTopBorderVisible()).toBe(true);
  });

  it('should not draw border-top of the pagination container when the workspace height is the same as tables content height', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: (getDefaultRowHeight() * 10) + getPaginationContainerHeight() +
        (spec().loadedTheme === 'classic' ? 1 : 0),
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(false);
  });

  it('should draw border-top of the pagination container when the workspace height is smaller than tables content height', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: 250,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(true);
  });

  it('should not draw border-top of the pagination container when the last row is fully visible (the viewport is scroll to most-bottom position)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: getDefaultRowHeight() * 5,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(true);

    await scrollViewportTo({ row: 8 });

    expect(isTopBorderVisible()).toBe(true);

    await scrollViewportTo({ row: 9 });

    expect(isTopBorderVisible()).toBe(false);
  });

  it('should not draw border-top of the pagination container in any case when table has not defined size', async() => {
    handsontable({
      data: createSpreadsheetData(11, 10),
      pagination: true,
    });

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
    const borderCompensation = spec().loadedTheme === 'classic' ? 1 : 0;

    expect(hot().rootElement.offsetHeight).toBe(height - borderCompensation);

    getPlugin('pagination').setPage(2);

    expect(hot().rootElement.offsetHeight).toBe(height - borderCompensation);

    getPlugin('pagination').setPage(3);

    expect(hot().rootElement.offsetHeight).toBe(height - borderCompensation);
  });

  it('should adjust the table height to fit the pagination container in declared height (all sections are visible)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 500,
      height: 400,
      pagination: true,
    });

    expect(tableView().getViewportHeight()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(366);
      main.toBe(356);
      horizon.toBe(352);
    });
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
