describe('Pagination `showPageNavigationSection` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to show the section', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showNavigation: false,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.showPageNavigationSection();

    expect(getPaginationContainerElement().querySelector('.ht-page-navigation-section')).toBeVisible();
  });

  it('should not affect the internal state or plugins settings', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showNavigation: false,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.showPageNavigationSection();

    expect(plugin.getSetting('showNavigation')).toBe(false);
  });
});
