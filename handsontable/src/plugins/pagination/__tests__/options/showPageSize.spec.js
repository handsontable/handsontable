describe('Pagination `showPageSize` option', () => {
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

    expect(plugin.getSetting('showPageSize')).toBe(true);
  });

  it('should be possible to show the section and then hide', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showPageSize: true,
      },
    });

    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).toBeVisible();

    await updateSettings({
      pagination: {
        showPageSize: false,
      },
    });

    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).not.toBeVisible();
  });

  it('should be possible to hide the section and then show', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        showPageSize: false,
      },
    });

    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).not.toBeVisible();

    await updateSettings({
      pagination: {
        showPageSize: true,
      },
    });

    expect(getPaginationContainerElement().querySelector('.ht-page-size-section')).toBeVisible();
  });
});
