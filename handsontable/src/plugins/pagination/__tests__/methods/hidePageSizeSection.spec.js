describe('Pagination `hidePageSizeSection` method', () => {
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
        showPageSize: true,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageSizeSection();

    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).not.toBeVisible();
  });

  it('should not affect the internal state or plugins settings', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showPageSize: true,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageSizeSection();

    expect(plugin.getSetting('showPageSize')).toBe(true);
  });
});
