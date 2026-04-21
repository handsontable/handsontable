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
    ['Control/Meta', 'ArrowUp'],
    ['Home'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the first item', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();
      await scrollWindowTo(0, 1000);
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      // The viewport is scrolled so the first item is visible at the top.
      // The exact scrollY depends on the menu container's top padding which
      // is theme-dependent, so assert that the first item is within the
      // viewport instead of hardcoding a pixel value.
      const firstItemRect = $('.htContextMenu:visible')
        .find('.ht_master .htCore tbody td').not('.htSeparator')[0]
        .getBoundingClientRect();

      expect(window.scrollY).toBeLessThan(1000);
      expect(firstItemRect.top).toBeGreaterThanOrEqual(0);
      expect(firstItemRect.top).toBeLessThan(firstItemRect.height);
    });

    it('should move the menu item selection to the first active item', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');

      await keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });
  });

});
