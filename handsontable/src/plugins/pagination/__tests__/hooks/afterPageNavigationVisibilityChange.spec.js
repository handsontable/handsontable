describe('Pagination `afterPageNavigationVisibilityChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired after showing the component using `updateSettings`', async() => {
    const afterPageNavigationVisibilityChange = jasmine.createSpy('afterPageNavigationVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageNavigationVisibilityChange,
    });

    await updateSettings({
      pagination: {
        showNavigation: true,
      },
    });

    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('should be fired after showing the component using the plugins method', async() => {
    const afterPageNavigationVisibilityChange = jasmine.createSpy('afterPageNavigationVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageNavigationVisibilityChange,
    });

    const plugin = getPlugin('pagination');

    plugin.showPageNavigationSection();

    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('should be fired after hiding the component using `updateSettings`', async() => {
    const afterPageNavigationVisibilityChange = jasmine.createSpy('afterPageNavigationVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageNavigationVisibilityChange,
    });

    await updateSettings({
      pagination: {
        showNavigation: false,
      },
    });

    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledWith(false);
  });

  it('should be fired after hiding the component using the plugins method', async() => {
    const afterPageNavigationVisibilityChange = jasmine.createSpy('afterPageNavigationVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageNavigationVisibilityChange,
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageNavigationSection();

    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageNavigationVisibilityChange).toHaveBeenCalledWith(false);
  });
});
