describe('ContextMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
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
      expect(window.scrollY).forThemes(({ classic, main, horizon }) => {
        classic.toBe(1);
        main.toBe(10);
        horizon.toBe(14);
      });
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
