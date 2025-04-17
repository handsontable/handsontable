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
    ['Control/Meta', 'ArrowUp'],
    ['Home'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the first item', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
      });

      await dropdownMenu();
      await scrollWindowTo(0, 1000);
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).forThemes(({ classic, main, horizon }) => {
        classic.toBe(25);
        main.toBe(35);
        horizon.toBe(43);
      });
    });

    it('should move the menu item selection to the first active item', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      await dropdownMenu();
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');

      await keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      await dropdownMenu();
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem()).toBe(null);
    });
  });
});
