describe('Loading - beforeLoadingShow hook', () => {
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

  it('should call beforeLoadingShow hook', async() => {
    const beforeLoadingShowSpy = jasmine.createSpy('beforeLoadingShow');

    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
      beforeLoadingShow: beforeLoadingShowSpy,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();

    expect(beforeLoadingShowSpy).toHaveBeenCalledTimes(1);
  });

  it('should not show the loading dialog when beforeLoadingShow hook returns false', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    addHook('beforeLoadingShow', () => {
      return false;
    });

    loadingPlugin.show();

    expect(loadingPlugin.isVisible()).toBe(false);
  });
});
