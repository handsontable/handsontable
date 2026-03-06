describe('Pagination `uiContainer` option', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should have defined default `null` value', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('uiContainer')).toBe(null);
  });

  it('should be possible to install pagination container', async() => {
    const externalContainer = $('<div id="externalContainer"></div>').appendTo('body')[0];

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        uiContainer: externalContainer,
      },
    });

    const paginationContainer = externalContainer.firstElementChild;

    expect(paginationContainer.getAttribute('dir')).toBe('ltr');
    expect(paginationContainer).toHaveClass('ht-pagination');
    expect(paginationContainer).toHaveClass('handsontable');
    expect(paginationContainer).toHaveClass('ht-pagination--bordered');

    if (spec().loadedTheme !== 'classic') {
      expect(paginationContainer).toHaveClass(`ht-theme-${spec().loadedTheme}`);
    }

    expect(externalContainer.className).toBe('');
    expect(visualizePageSections(externalContainer)).toEqual([
      'Page size: [auto, 5, [10], 20, 50, 100]',
      '1 - 10 of 45',
      '|< < Page 1 of 5 [>] [>|]',
    ]);

    externalContainer.remove();
  });

  it('should correctly clear the external container after destroy', async() => {
    const externalContainer = $('<div id="externalContainer" class="testClass"></div>').appendTo('body')[0];

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        uiContainer: externalContainer,
      },
    });

    destroy();

    expect(externalContainer.className).toBe('testClass');
    expect(externalContainer.innerHTML.trim()).toBe('');

    externalContainer.remove();
  });

  it('should not adjust the table height when the uiContainer is provided', async() => {
    const externalContainer = $('<div id="externalContainer" class="testClass"></div>').appendTo('body')[0];

    handsontable({
      data: createSpreadsheetData(45, 10),
      width: 500,
      height: 400,
      pagination: {
        uiContainer: externalContainer,
      },
    });

    expect(tableView().getViewportHeight()).toBe(400);

    externalContainer.remove();
  });
});
