describe('Pagination `showPageCounterSection` method', () => {
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
        showCounter: false,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.showPageCounterSection();

    expect(getPaginationContainerElement().querySelector('.ht-page-counter-section')).toBeVisible();
  });

  it('should not affect the internal state or plugins settings', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showCounter: false,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.showPageCounterSection();

    expect(plugin.getSetting('showCounter')).toBe(false);
  });
});
