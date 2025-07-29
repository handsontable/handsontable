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

  describe('"ArrowDown"', () => {
    it('should move the menu item selection to the first item when there was no selection', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the first item and scroll the viewport', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(200),
      });

      await contextMenu();
      await scrollWindowTo(0, 1000);
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).forThemes(({ classic, main, horizon }) => {
        classic.toBe(1);
        main.toBe(9);
        horizon.toBe(13);
      });
    });

    it('should move the menu item selection to the next item (skipping `disabled` items)', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disabled = true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the next item (skipping `disableSelection` items)', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disableSelection = true;
          }

          return item;
        }),
      });

      await contextMenu();
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
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
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
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
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
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
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');

      await keyDownUp('arrowdown');

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
      await keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });

    it('should select the first item in the menu, even when external input is focused (#6550)', async() => {
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
      await keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      document.body.removeChild(input);
    });
  });
});
