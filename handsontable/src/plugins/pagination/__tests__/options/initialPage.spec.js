describe('Pagination `initialPage` option', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should have defined default value', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('initialPage')).toBe(1);
  });

  it('should be possible to change value in settings', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('initialPage')).toBe(5);
    expect(countVisibleRows()).toBe(5);
  });

  it('should be possible to change value via `updateSettings`', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });

    await updateSettings({
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('initialPage')).toBe(5);
    expect(countVisibleRows()).toBe(5);
  });

  // TODO: add tests that checks UI when `initialPage` is changed
});
