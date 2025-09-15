describe('Pagination `showPageSizeSection` method', () => {
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
        showPageSize: false,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.showPageSizeSection();

    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).toBeVisible();
  });

  it('should not affect the internal state or plugins settings', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showPageSize: false,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.showPageSizeSection();

    expect(plugin.getSetting('showPageSize')).toBe(false);
  });
});
