describe('Loading - afterLoadingHide hook', () => {
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

  it('should call afterLoadingHide hook', async() => {
    const afterLoadingHideSpy = jasmine.createSpy('afterLoadingHide');

    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
      afterLoadingHide: afterLoadingHideSpy,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();
    loadingPlugin.hide();

    expect(afterLoadingHideSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call afterLoadingHide hook when loading is not visible', async() => {
    const afterLoadingHideSpy = jasmine.createSpy('afterLoadingHide');

    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
      afterLoadingHide: afterLoadingHideSpy,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.hide();

    expect(afterLoadingHideSpy).not.toHaveBeenCalled();
    expect(loadingPlugin.isVisible()).toBe(false);
  });
});
