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

  describe('"PageDown"', () => {
    it('should move the menu item selection to the last item that is visible in the browser viewport ' +
       'when there is no initial selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
      });

      dropdownMenu();
      keyDownUp('pagedown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the last item when the menu fits within the browser viewport ' +
       'and there is initial selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(10),
      });

      dropdownMenu();
      getPlugin('dropdownMenu').menu.getNavigator().toFirstItem();
      keyDownUp('pagedown');

      const hotMenu = getPlugin('dropdownMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[9, 0, 9, 0]]);
      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 10');
    });

    it('should move the menu item selection down by the count of visible items in the browser viewport', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
      });

      dropdownMenu();
      getPlugin('dropdownMenu').menu.getNavigator().toFirstItem();
      keyDownUp('pagedown');

      const menuView = getPlugin('dropdownMenu').menu.hotMenu.view;
      let firstVisibleRow = 0;

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);
      }
    });
  });
});
