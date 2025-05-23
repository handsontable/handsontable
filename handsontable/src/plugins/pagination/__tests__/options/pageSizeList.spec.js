describe('Pagination `pageSizeList` option', () => {
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

    expect(plugin.getSetting('pageSizeList')).toEqual([5, 10, 20, 50, 100]);
  });

  it('should be possible to change value in settings', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        pageSizeList: [10, 20, 30],
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('pageSizeList')).toEqual([10, 20, 30]);
    expect(countVisibleRows()).toBe(10);
  });

  it('should be possible to change value via `updateSettings`', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });

    await updateSettings({
      pagination: {
        pageSizeList: [10, 20, 30],
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('pageSizeList')).toEqual([10, 20, 30]);
    expect(countVisibleRows()).toBe(10);
  });

  it('should update UI elements according to the plugins changes', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        pageSizeList: [10, 20, 30],
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [10, 20, 30]',
      '1 - 10 of 45',
      '|< < Page 1 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        pageSizeList: [100, 200],
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [100, 200]',
      '1 - 10 of 45',
      '|< < Page 1 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        pageSizeList: [20],
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [20]',
      '1 - 10 of 45',
      '|< < Page 1 of 5 [>] [>|]',
    ]);
  });
});
