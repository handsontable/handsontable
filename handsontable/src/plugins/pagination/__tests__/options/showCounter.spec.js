describe('Pagination `showCounter` option', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // TODO: add tests that checks UI when `showCounter` is changed (maybe visual tests would be better)

  it('should have defined default value', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getSetting('showCounter')).toBe(true);
  });

  it('should be possible to show the section and then hide', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showCounter: true,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-counter-section')).toBeVisible();

    await updateSettings({
      pagination: {
        showCounter: false,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-counter-section')).not.toBeVisible();
  });

  it('should be possible to hide the section and then show', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showCounter: false,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-counter-section')).not.toBeVisible();

    await updateSettings({
      pagination: {
        showCounter: true,
      },
    });

    expect(hot.rootWrapperElement.querySelector('.ht-page-counter-section')).toBeVisible();
  });
});
