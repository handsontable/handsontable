describe('Core.getFocusScopeManager', () => {
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

  it('should return the focus scope manager instance', async() => {
    handsontable({});

    expect(getFocusScopeManager()).toBeDefined();
    expect(getFocusScopeManager().registerScope).toBeDefined();
    expect(getFocusScopeManager().unregisterScope).toBeDefined();
    expect(getFocusScopeManager().activateScope).toBeDefined();
    expect(getFocusScopeManager().deactivateScope).toBeDefined();
    expect(getFocusScopeManager().getActiveScopeId).toBeDefined();
  });

  it('should throw an error if the method is called on a non-root instance', async() => {
    handsontable({
      contextMenu: true,
    });

    await contextMenu();

    const hotMenu = getPlugin('contextMenu').menu.hotMenu;

    expect(() => {
      hotMenu.getFocusScopeManager();
    }).toThrowError('The FocusScopeManager is only available for the main Handsontable instance.');
  });
});
