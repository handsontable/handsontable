describe('Pagination `pageSize` option', () => {
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

    expect(plugin.getSetting('pageSize')).toBe(10);
    expect(countVisibleRows()).toBe(10);
  });

  it('should be possible to change value in settings', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: {
        pageSize: 5,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('pageSize')).toBe(5);
    expect(countVisibleRows()).toBe(5);
  });

  it('should be possible to change value via `updateSettings`', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    await updateSettings({
      pagination: {
        pageSize: 3,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('pageSize')).toBe(3);
    expect(countVisibleRows()).toBe(3);
  });

  it('should throw an error when `pageSize` is `0`', async() => {
    expect(() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        pagination: {
          pageSize: 0,
        },
      });
    }).toThrowError('The `pageSize` option must be greater than `0`.');
  });

  it('should update UI elements according to the plugins changes', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [5, 10, 20, 50, 100]',
      '1 - 10 of 45',
      '|< < Page 1 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        pageSize: 12,
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [5, 10, 20, 50, 100]',
      '1 - 12 of 45',
      '|< < Page 1 of 4 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        pageSize: 40,
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [5, 10, 20, 50, 100]',
      '1 - 40 of 45',
      '|< < Page 1 of 2 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        pageSize: 45,
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [5, 10, 20, 50, 100]',
      '1 - 45 of 45',
      '|< < Page 1 of 1 > >|',
    ]);

    await updateSettings({
      pagination: {
        pageSize: 50,
      },
    });

    expect(visualizePageSections()).toEqual([
      'Page size: [5, 10, 20, 50, 100]',
      '1 - 45 of 45',
      '|< < Page 1 of 1 > >|',
    ]);
  });
});
