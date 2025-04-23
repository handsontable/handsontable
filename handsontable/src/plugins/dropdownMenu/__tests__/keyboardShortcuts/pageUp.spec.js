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

  describe('"PageUp"', () => {
    it('should move the menu item selection to the first item that is visible in the browser viewport ' +
       'when there is no initial selection', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
      });

      await dropdownMenu();
      await scrollWindowTo(0, 1000);
      await keyDownUp('pageup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).forThemes(({ classic, main, horizon }) => {
        classic.toBe(25);
        main.toBe(35);
        horizon.toBe(43);
      });
    });

    it('should move the menu item selection to the first item when the menu fits within the browser viewport ' +
       'and there is initial selection', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(10),
      });

      await dropdownMenu();
      getPlugin('dropdownMenu').menu.getNavigator().toLastItem();
      await keyDownUp('pageup');

      const hotMenu = getPlugin('dropdownMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection up by the count of visible items in the browser viewport', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
      });

      await dropdownMenu();

      getPlugin('dropdownMenu').menu.getNavigator().toLastItem();

      await scrollWindowTo(0, document.documentElement.scrollHeight);
      await keyDownUp('pageup');

      const menuView = getPlugin('dropdownMenu').menu.hotMenu.view;
      let lastVisibleRow = 199;

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      await keyDownUp('pageup');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      await keyDownUp('pageup');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      await keyDownUp('pageup');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);
      }
    });
  });
});
