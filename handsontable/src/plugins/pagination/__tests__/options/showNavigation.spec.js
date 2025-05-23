describe('Pagination `showNavigation` option', () => {
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

    expect(plugin.getSetting('showNavigation')).toBe(true);
  });

  it('should be possible to show the section and then hide', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showNavigation: true,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-navigation-section')).toBeVisible();

    await updateSettings({
      pagination: {
        showNavigation: false,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-navigation-section')).not.toBeVisible();
  });

  it('should be possible to hide the section and then show', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showNavigation: false,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-navigation-section')).not.toBeVisible();

    await updateSettings({
      pagination: {
        showNavigation: true,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-navigation-section')).toBeVisible();
  });
});
