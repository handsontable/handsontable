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
    it('should execute the selected menu action', () => {
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

      dropdownMenu();

      const menuHot = getPlugin('dropdownMenu').menu.hotMenu;

      keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      expect(itemAction).not.toHaveBeenCalled();

      keyDownUp(keyboardShortcut);

      expect(itemAction).toHaveBeenCalled();
      expect($(getPlugin('dropdownMenu').menu).is(':visible')).toBe(false);
    });

    it('should not throw an error when any of the menu item is not selected', () => {
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

      contextMenu();
      keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should trigger the submenu to be opened', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: ['alignment'],
      });

      dropdownMenu();

      keyDownUp('arrowdown');
      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });
});
