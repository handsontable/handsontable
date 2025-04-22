describe('ContextMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  using('', [
    ['Enter'],
    ['Space'],
  ], (keyboardShortcut) => {
    it('should execute the selected menu action', async() => {
      const itemAction = jasmine.createSpy('itemAction');

      handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item1',
              callback: itemAction
            },
            item2: 'Item2'
          }
        },
        height: 100
      });

      await contextMenu();

      const menuHot = getPlugin('contextMenu').menu.hotMenu;

      await keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      expect(itemAction).not.toHaveBeenCalled();

      await keyDownUp(keyboardShortcut);

      expect(itemAction).toHaveBeenCalled();
      expect($(getPlugin('contextMenu').menu).is(':visible')).toBe(false);
    });

    it('should not throw an error when any of the menu item is not selected', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({
        contextMenu: true,
      });

      await contextMenu();
      await keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should trigger the submenu to be opened', async() => {
      handsontable({
        contextMenu: ['alignment'],
      });

      await contextMenu();

      await keyDownUp('arrowdown');
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });
});
