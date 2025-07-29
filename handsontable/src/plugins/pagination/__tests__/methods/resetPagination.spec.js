describe('Pagination `resetPagination` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should reset the state of the plugin to the initial values', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);
    plugin.setPageSize(6);
    plugin.hidePageSizeSection();
    plugin.hidePageCounterSection();
    plugin.hidePageNavigationSection();

    plugin.resetPagination();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(plugin.getPaginationData().pageSize).toBe(10);
    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).toBeVisible();
    expect(getPaginationContainerElement().querySelector('.ht-page-counter-section')).toBeVisible();
    expect(getPaginationContainerElement().querySelector('.ht-page-navigation-section')).toBeVisible();

    await updateSettings({
      pagination: {
        initialPage: 2,
        pageSize: 6,
        showPageSize: false,
        showCounter: true,
        showNavigation: false,
      },
    });

    plugin.setPage(3);
    plugin.setPageSize(7);
    plugin.showPageSizeSection();
    plugin.showPageCounterSection();
    plugin.showPageNavigationSection();

    plugin.resetPagination();

    expect(plugin.getPaginationData().currentPage).toBe(2);
    expect(plugin.getPaginationData().pageSize).toBe(6);
    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).not.toBeVisible();
    expect(getPaginationContainerElement().querySelector('.ht-page-counter-section')).toBeVisible();
    expect(getPaginationContainerElement().querySelector('.ht-page-navigation-section')).not.toBeVisible();
  });
});
