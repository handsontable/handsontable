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

  describe('"PageUp"', () => {
    it('should move the menu item selection to the first item that is visible in the browser viewport ' +
       'when there is no initial selection', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();
      await scrollWindowTo(0, 1000);
      await keyDownUp('pageup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      // After the plugin scrolls the viewport, the first item should be
      // visible at the top. The exact scrollY depends on the menu container's
      // top padding which is theme-dependent, so assert that the first item
      // is within the viewport instead of hardcoding a pixel value.
      const firstItemRect = $('.htContextMenu:visible')
        .find('.ht_master .htCore tbody td').not('.htSeparator')[0]
        .getBoundingClientRect();

      expect(window.scrollY).toBeLessThan(1000);
      expect(firstItemRect.top).toBeGreaterThanOrEqual(0);
      expect(firstItemRect.top).toBeLessThan(firstItemRect.height);
    });

    it('should move the menu item selection to the first item when the menu fits within the browser viewport' +
       'and there is initial selection', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(10),
      });

      await contextMenu();
      getPlugin('contextMenu').menu.getNavigator().toLastItem();
      await keyDownUp('pageup');

      const hotMenu = getPlugin('contextMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection up by the count of visible items in the browser viewport', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();

      getPlugin('contextMenu').menu.getNavigator().toLastItem();

      await scrollWindowTo(0, document.documentElement.scrollHeight);
      await keyDownUp('pageup');

      const menuView = getPlugin('contextMenu').menu.hotMenu.view;
      let lastVisibleRow = 199;

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      await keyDownUp('pageup');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      await keyDownUp('pageup');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      await keyDownUp('pageup');

      {
        const startRow = menuView.getFirstPartiallyVisibleRow();
        const endRow = menuView.getLastPartiallyVisibleRow();

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);
      }
    });
  });
});
