describe('Context menu theme handling', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
    }
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    handsontable({
      contextMenu: true,
      themeName: 'ht-theme-sth',
    });

    contextMenu();

    await sleep(50);

    expect($(getPlugin('contextMenu').menu.container).parent().hasClass('ht-theme-sth')).toBe(true);
    expect(getPlugin('contextMenu').menu.hotMenu.getCurrentThemeName()).toBe('ht-theme-sth');
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    spec().$container.addClass('ht-theme-sth-else');

    handsontable({
      contextMenu: true,
    }, true);

    contextMenu();

    await sleep(50);

    expect($(getPlugin('contextMenu').menu.container).parent().hasClass('ht-theme-sth-else')).toBe(true);
    expect(getPlugin('contextMenu').menu.hotMenu.getCurrentThemeName()).toBe('ht-theme-sth-else');
  });
});
