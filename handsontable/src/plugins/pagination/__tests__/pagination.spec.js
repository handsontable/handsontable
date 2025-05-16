describe('Pagination', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to enable the plugin (default values check)', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSetting('pageSize')).toBe(10);
    expect(plugin.getSetting('pageList')).toEqual([5, 10, 20, 50, 100]);
    expect(plugin.getSetting('initialPage')).toBe(1);
    expect(plugin.getSetting('autoPageSize')).toBe(false);
    expect(plugin.getSetting('showPageSize')).toBe(true);
    expect(plugin.getSetting('showCounter')).toBe(true);
    expect(plugin.getSetting('showNavigation')).toBe(true);
    expect(countVisibleRows()).toBe(10);
  });

  it('should be possible to enable the plugin (custom values check)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
        pageList: [3, 6, 9],
        initialPage: 2,
        autoPageSize: true,
        showPageSize: false,
        showCounter: false,
        showNavigation: false,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSetting('pageSize')).toBe(3);
    expect(plugin.getSetting('pageList')).toEqual([3, 6, 9]);
    expect(plugin.getSetting('initialPage')).toBe(2);
    expect(plugin.getSetting('autoPageSize')).toBe(true);
    expect(plugin.getSetting('showPageSize')).toBe(false);
    expect(plugin.getSetting('showCounter')).toBe(false);
    expect(plugin.getSetting('showNavigation')).toBe(false);
    expect(countVisibleRows()).toBe(3);
  });

  it('should be possible to update the plugin settings', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
        pageList: [3, 6, 9],
        initialPage: 2,
        autoPageSize: true,
        showPageSize: false,
        showCounter: false,
        showNavigation: false,
      },
    });

    await updateSettings({
      pagination: {
        pageSize: 5,
        pageList: [5, 10, 15],
        initialPage: 1,
      }
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSetting('pageSize')).toBe(5);
    expect(plugin.getSetting('pageList')).toEqual([5, 10, 15]);
    expect(plugin.getSetting('initialPage')).toBe(1);
    expect(countVisibleRows()).toBe(5);
  });

  it('should be possible to update the plugin settings', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
        pageList: [3, 6, 9],
        initialPage: 2,
        autoPageSize: true,
        showPageSize: false,
        showCounter: false,
        showNavigation: false,
      },
    });

    await updateSettings({
      pagination: {
        pageSize: 5,
        pageList: [5, 10, 15],
        initialPage: 1,
      }
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSetting('pageSize')).toBe(5);
    expect(plugin.getSetting('pageList')).toEqual([5, 10, 15]);
    expect(plugin.getSetting('initialPage')).toBe(1);
    expect(countVisibleRows()).toBe(5);
  });

  it('should be possible to disable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    await updateSettings({
      pagination: false,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(false);
    expect(countVisibleRows()).toBe(10);
  });
});
