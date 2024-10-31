describe('Theme handling', () => {
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
    const hot = handsontable({
      contextMenu: true,
      themeName: 'ht-theme-sth',
    });

    contextMenu();

    await sleep(50);

    expect($(hot.getPlugin('contextMenu').menu.container).hasClass('ht-theme-sth')).toBe(true);
    expect(hot.getPlugin('contextMenu').menu.hotMenu.view.getCurrentThemeName()).toEqual('ht-theme-sth');
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    spec().$container.addClass('ht-theme-sth-else');
    const hot = handsontable({
      contextMenu: true,
    });

    contextMenu();

    await sleep(50);

    expect($(hot.getPlugin('contextMenu').menu.container).hasClass('ht-theme-sth-else')).toBe(true);
    expect(hot.getPlugin('contextMenu').menu.hotMenu.view.getCurrentThemeName()).toEqual('ht-theme-sth-else');
  });
});
