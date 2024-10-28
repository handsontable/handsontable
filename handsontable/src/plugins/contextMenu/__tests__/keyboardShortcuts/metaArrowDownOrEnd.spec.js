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
    ['Control/Meta', 'ArrowDown'],
    ['End'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the last item', () => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the last active item', () => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 103');

      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 103');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });
  });
});
