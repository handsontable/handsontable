describe('Pagination `hidePageNavigationSection` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to hide the section', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showNavigation: true,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageNavigationSection();

    expect(getPaginationContainerElement().querySelector('.ht-page-navigation-section')).not.toBeVisible();
  });

  it('should not affect the internal state or plugins settings', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showNavigation: true,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageNavigationSection();

    expect(plugin.getSetting('showNavigation')).toBe(true);
  });
});
