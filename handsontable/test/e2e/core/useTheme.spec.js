describe('useTheme', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    }, true);
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  it('should change the theme to the one specified by the provided class name', () => {
    expect(getCurrentThemeName()).toBe(undefined);

    useTheme('ht-theme-sth');

    expect(getCurrentThemeName()).toBe('ht-theme-sth');

    useTheme(undefined);

    expect(getCurrentThemeName()).toBe(undefined);
  });

  it('should add the appropriate class names to the root element when enabling a theme', () => {
    expect(spec().$container.parent().hasClass('ht-theme-sth')).toBe(false);

    useTheme('ht-theme-sth');

    expect(spec().$container.parent().hasClass('ht-theme-sth')).toBe(true);
  });
});
