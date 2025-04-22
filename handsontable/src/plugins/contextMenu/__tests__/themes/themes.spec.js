describe('Context menu theme handling', () => {
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

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    simulateModernThemeStylesheet(spec().$container.parent());
    handsontable({
      contextMenu: true,
      themeName: 'ht-theme-sth',
    });

    contextMenu();

    await sleep(50);

    expect($(getPlugin('contextMenu').menu.container).hasClass('ht-theme-sth')).toBe(true);
    expect(getPlugin('contextMenu').menu.hotMenu.getCurrentThemeName()).toBe('ht-theme-sth');

    clearModernThemeStylesheetMock(spec().$container.parent());
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    simulateModernThemeStylesheet(spec().$container.parent());
    spec().$container.addClass('ht-theme-sth-else');
    handsontable({
      contextMenu: true,
    }, true);

    contextMenu();

    await sleep(50);

    expect($(getPlugin('contextMenu').menu.container).hasClass('ht-theme-sth-else')).toBe(true);
    expect(getPlugin('contextMenu').menu.hotMenu.getCurrentThemeName()).toBe('ht-theme-sth-else');

    clearModernThemeStylesheetMock(spec().$container.parent());
  });
});
