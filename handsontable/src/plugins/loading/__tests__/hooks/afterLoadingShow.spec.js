describe('Loading - afterLoadingShow hook', () => {
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

  it('should call afterLoadingShow hook', async() => {
    const afterLoadingShowSpy = jasmine.createSpy('afterLoadingShow');

    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
      afterLoadingShow: afterLoadingShowSpy,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();

    expect(afterLoadingShowSpy).toHaveBeenCalledTimes(1);
  });
});
