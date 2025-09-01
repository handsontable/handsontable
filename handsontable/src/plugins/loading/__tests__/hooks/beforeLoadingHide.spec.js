describe('Loading - beforeLoadingHide hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call beforeLoadingHide hook', async() => {
    const beforeLoadingHideSpy = jasmine.createSpy('beforeLoadingHide');

    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
      beforeLoadingHide: beforeLoadingHideSpy,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();
    loadingPlugin.hide();

    expect(beforeLoadingHideSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call beforeLoadingHide hook when loading is not visible', async() => {
    const beforeLoadingHideSpy = jasmine.createSpy('beforeLoadingHide');

    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
      beforeLoadingHide: beforeLoadingHideSpy,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.hide();

    expect(beforeLoadingHideSpy).not.toHaveBeenCalled();
    expect(loadingPlugin.isVisible()).toBe(false);
  });
});
