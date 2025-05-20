describe('useTheme', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    handsontable({
      data: createSpreadsheetData(5, 5),
    }, true);
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the theme to the one specified by the provided class name', async() => {
    expect(getCurrentThemeName()).toBe(undefined);

    await useTheme('ht-theme-sth');

    expect(getCurrentThemeName()).toBe('ht-theme-sth');

    await useTheme(undefined);

    expect(getCurrentThemeName()).toBe(undefined);
  });

  it('should add the appropriate class names to the root element when enabling a theme', async() => {
    expect(spec().$container.children().first().hasClass('ht-theme-sth')).toBe(false);

    await useTheme('ht-theme-sth');

    expect(spec().$container.children().first().hasClass('ht-theme-sth')).toBe(true);
  });
});
