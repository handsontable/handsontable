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

  it('should not change the internal currentPage state when the initialPage setting is not provided', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 4,
      },
    });

    await updateSettings({
      pagination: {
        pageSize: 12,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData().currentPage).toBe(4);
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

  it('should not be possible to change value to invalid one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: -10,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData().currentPage).toBe(1);

    await updateSettings({
      pagination: {
        initialPage: 100,
      },
    });

    expect(plugin.getPaginationData().currentPage).toBe(5);
  });

  it('should render elements according to the plugins changes', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 1,
      },
      renderAllRows: true,
    });

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, 5, [10], 20, 50, 100]',
      '1 - 10 of 45',
      '|< < Page 1 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        initialPage: 2,
      },
    });

    expect(getHtCore().find('tr:first td:first').text()).toBe('A11');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A20');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, 5, [10], 20, 50, 100]',
      '11 - 20 of 45',
      '[|<] [<] Page 2 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        initialPage: 3,
      },
    });

    expect(getHtCore().find('tr:first td:first').text()).toBe('A21');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, 5, [10], 20, 50, 100]',
      '21 - 30 of 45',
      '[|<] [<] Page 3 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        initialPage: 4,
      },
    });

    expect(getHtCore().find('tr:first td:first').text()).toBe('A31');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A40');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, 5, [10], 20, 50, 100]',
      '31 - 40 of 45',
      '[|<] [<] Page 4 of 5 [>] [>|]',
    ]);

    await updateSettings({
      pagination: {
        initialPage: 5,
      },
    });

    expect(getHtCore().find('tr:first td:first').text()).toBe('A41');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, 5, [10], 20, 50, 100]',
      '41 - 45 of 45',
      '[|<] [<] Page 5 of 5 > >|',
    ]);
  });
});
