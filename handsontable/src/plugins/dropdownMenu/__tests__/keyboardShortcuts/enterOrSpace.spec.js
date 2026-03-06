describe('DropdownMenu keyboard shortcut', () => {
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
        colHeaders: true,
        dropdownMenu: {
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

      await dropdownMenu();

      const menuHot = getPlugin('dropdownMenu').menu.hotMenu;

      await keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      expect(itemAction).not.toHaveBeenCalled();

      await keyDownUp(keyboardShortcut);

      expect(itemAction).toHaveBeenCalled();
      expect($(getPlugin('dropdownMenu').menu).is(':visible')).toBe(false);
    });

    it('should not throw an error when any of the menu item is not selected', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({
        colHeaders: true,
        dropdownMenu: true,
      });

      await contextMenu();
      await keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should trigger the submenu to be opened', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: ['alignment'],
      });

      await dropdownMenu();

      await keyDownUp('arrowdown');
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });
});
