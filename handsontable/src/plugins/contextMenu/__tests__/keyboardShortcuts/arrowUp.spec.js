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

  describe('"ArrowUp"', () => {
    it('should move the menu item selection to the last item when there was no selection', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
    });

    it('should move the menu item selection to the last item and scroll the viewport', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the previous item (skipping `disableSelection` items)', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disableSelection = true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the previous item (skipping `disabled` items)', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disabled = true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the next item (skipping separators)', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          if (i % 2) {
            item.name = Handsontable.plugins.ContextMenu.SEPARATOR.name;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the next item (skipping hidden items)', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          if (i % 2) {
            item.hidden = () => true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should not move the selection when there is only one active menu item', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200, (i, item) => {
          if (i !== 100) {
            item.disabled = true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');

      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });

    it('should select the last item in the menu, even when external input is focused (#6550)', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      const input = document.createElement('input');

      document.body.appendChild(input);
      await contextMenu();

      const menuHot = getPlugin('contextMenu').menu.hotMenu;

      expect(menuHot.getSelected()).toBeUndefined();

      input.focus();
      await keyDownUp('arrowup');

      expect(menuHot.getSelected()).toEqual([[17, 0, 17, 0]]);

      document.body.removeChild(input);
    });
  });
});
