describe('getCurrentThemeName', () => {
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

  it('should return `undefined` when asking for a theme name, when none is set', async() => {
    expect(getCurrentThemeName()).toBe(undefined);
  });

  it('should get the current theme name', async() => {
    await useTheme('ht-theme-sth');

    expect(getCurrentThemeName()).toBe('ht-theme-sth');
  });
});
